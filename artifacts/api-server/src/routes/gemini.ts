import { Router, type IRouter } from "express";
import { GenerateCoverLetterBody, GenerateCoverLetterResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const requestTimesByClient = new Map<string, number[]>();
const MAX_REQUESTS_PER_WINDOW = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const GEMINI_MODEL = "gemini-3.1-flash-lite";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type GeminiErrorResponse = {
  error?: {
    status?: string;
    message?: string;
  };
};

function isRateLimited(clientKey: string, now: number): boolean {
  const recentTimes = (requestTimesByClient.get(clientKey) ?? []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  );

  if (recentTimes.length >= MAX_REQUESTS_PER_WINDOW) {
    requestTimesByClient.set(clientKey, recentTimes);
    return true;
  }

  recentTimes.push(now);
  requestTimesByClient.set(clientKey, recentTimes);

  if (requestTimesByClient.size > 500) {
    for (const [key, times] of requestTimesByClient) {
      if (times.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) {
        requestTimesByClient.delete(key);
      }
    }
  }

  return false;
}

router.post("/gemini/cover-letter", async (req, res) => {
  const parsed = GenerateCoverLetterBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please check the candidate and internship details." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI generation is not configured for this app." });
  }

  const clientKey = req.ip || "unknown";
  if (isRateLimited(clientKey, Date.now())) {
    return res.status(429).json({ error: "Too many drafts were requested. Please wait a few minutes and try again." });
  }

  const {
    candidateName,
    skills,
    experience,
    role,
    company,
    location,
    duration,
    description,
  } = parsed.data;

  const candidateContext = [
    `Candidate name: ${candidateName}`,
    `Relevant skills: ${skills.join(", ")}`,
    experience?.trim() ? `Experience or projects provided by the candidate: ${experience.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const internshipContext = [
    `Role: ${role}`,
    `Company: ${company}`,
    location ? `Location: ${location}` : "",
    duration ? `Duration: ${duration}` : "",
    description ? `Opportunity description: ${description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const systemInstruction = [
    "You write concise, specific, professional cover letters for internship applications.",
    "Use only the candidate facts provided. Never invent qualifications, degrees, projects, metrics, dates, or achievements.",
    "Connect the candidate's stated skills and experience to the internship details.",
    "Return only the cover letter text, around 150 to 190 words, with a greeting and a sign-off using the candidate's name.",
  ].join(" ");

  const userPrompt = `Write a tailored application letter for this internship.\n\n${candidateContext}\n\n${internshipContext}`;

  try {
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: userPrompt }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 8192,
            },
          }),
          signal: AbortSignal.timeout(25_000),
        },
      );

      if (response.ok || (response.status !== 429 && response.status < 500)) {
        break;
      }

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }

    if (!response?.ok) {
      let providerError: GeminiErrorResponse = {};
      try {
        providerError = (await response?.clone().json()) as GeminiErrorResponse;
      } catch {
        // Keep the user-facing response generic if the provider error is not JSON.
      }
      const safeMessage = (providerError.error?.message ?? "No provider details available")
        .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted]")
        .replace(/(api[_ -]?key|token|authorization)\s*[:=]\s*\S+/gi, "$1=[redacted]")
        .slice(0, 240);
      logger.warn(
        {
          status: response?.status ?? "no-response",
          providerStatus: providerError.error?.status,
          providerMessage: safeMessage,
        },
        "Gemini cover letter request failed",
      );
      return res.status(502).json({ error: "The AI service could not create this letter. Please try again shortly." });
    }

    const result = (await response.json()) as GeminiResponse;
    const coverLetter = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!coverLetter) {
      logger.warn("Gemini returned an empty cover letter");
      return res.status(502).json({ error: "The AI service returned an empty draft. Please try again." });
    }

    return res.json(GenerateCoverLetterResponse.parse({ coverLetter }));
  } catch {
    logger.warn("Gemini cover letter request could not be completed");
    return res.status(502).json({ error: "The AI service could not create this letter. Please try again shortly." });
  }
});

export default router;
