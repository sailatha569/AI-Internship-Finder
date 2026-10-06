import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Clock3,
  Code2,
  FileText,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import {
  getHealthCheckQueryKey,
  useGenerateCoverLetter,
  useHealthCheck,
} from '@workspace/api-client-react';
import { sampleInternships, type Internship } from '@/data/opportunities';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [candidateName, setCandidateName] = useState('V Sailatha');
  const [skills, setSkills] = useState(['Python', 'Machine Learning', 'Data Analysis']);
  const [skillDraft, setSkillDraft] = useState('');
  const [experience, setExperience] = useState('');
  const [searched, setSearched] = useState(true);
  const [sortMode, setSortMode] = useState('match');
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [letterErrors, setLetterErrors] = useState<Record<string, string>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const health = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 45000,
      retry: 1,
    },
  });
  const generateCoverLetter = useGenerateCoverLetter();

  const rankedInternships = useMemo(() => {
    const normalizedSkills = skills.map((skill) => skill.trim().toLocaleLowerCase());
    const skillAliases: Record<string, string[]> = {
      ai: ['machine learning', 'nlp', 'computer vision', 'product thinking'],
      'artificial intelligence': ['machine learning', 'nlp', 'computer vision', 'product thinking'],
      ml: ['machine learning'],
      'gen ai': ['nlp', 'machine learning'],
      'generative ai': ['nlp', 'machine learning'],
      'deep learning': ['machine learning', 'computer vision'],
    };
    const expandedSkills = normalizedSkills.flatMap((skill) => [
      skill,
      ...(skillAliases[skill] ?? []),
    ]);
    const ranked = sampleInternships
      .map((internship) => {
        const matchedSkills = internship.skills.filter((skill) =>
          expandedSkills.includes(skill.toLocaleLowerCase()),
        );
        return {
          internship,
          matchedSkills,
          score: Math.round((matchedSkills.length / internship.skills.length) * 100),
        };
      })
      .filter((item) => item.matchedSkills.length > 0);
    return ranked.sort((a, b) => {
      if (sortMode === 'stipend') {
        const amount = (value: string) => Number(value.replace(/[^\d]/g, ''));
        return amount(b.internship.stipend) - amount(a.internship.stipend) || b.score - a.score;
      }
      return b.score - a.score || b.matchedSkills.length - a.matchedSkills.length;
    }).slice(0, 5);
  }, [skills, sortMode]);

  const addSkill = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = skillDraft.trim().replace(/\s+/g, ' ');
    if (!value || skills.length >= 12 || skills.some((skill) => skill.toLocaleLowerCase() === value.toLocaleLowerCase())) return;
    setSkills((current) => [...current, value]);
    setSkillDraft('');
  };

  const requestLetter = (internship: Internship) => {
    setGeneratingId(internship.id);
    setCopiedId(null);
    setLetterErrors((current) => ({ ...current, [internship.id]: '' }));
    generateCoverLetter.mutate(
      {
        data: {
          candidateName: candidateName.trim() || 'V Sailatha',
          skills,
          ...(experience.trim() ? { experience: experience.trim() } : {}),
          role: internship.title,
          company: internship.company,
          location: internship.location,
          duration: internship.duration,
          description: internship.description,
        },
      },
      {
        onSuccess: (result) => {
          setLetters((current) => ({ ...current, [internship.id]: result.coverLetter }));
          setGeneratingId(null);
        },
        onError: (error) => {
          setLetterErrors((current) => ({
            ...current,
            [internship.id]: error instanceof Error
              ? error.message || 'The letter could not be generated. Please try again.'
              : 'The letter could not be generated. Please try again.',
          }));
          setGeneratingId(null);
        },
      },
    );
  };

  const copyLetter = async (internshipId: string) => {
    const letter = letters[internshipId];
    if (!letter) return;
    try {
      await navigator.clipboard.writeText(letter);
      setCopiedId(internshipId);
      window.setTimeout(() => setCopiedId((current) => current === internshipId ? null : current), 2200);
    } catch {
      setLetterErrors((current) => ({
        ...current,
        [internshipId]: 'Copy is unavailable in this browser. Select the letter text to copy it.',
      }));
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={19} strokeWidth={2.2} /></div>
          <div>
            <div className="brand-title">Pathfinder</div>
            <div className="brand-subtitle">Internship workspace</div>
          </div>
        </div>
        <div className="side-label">Workspace</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className="nav-item active" type="button" onClick={() => document.getElementById('results-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} data-testid="nav-opportunities">
            <BriefcaseBusiness aria-hidden="true" /> Opportunities
          </button>
          <button className="nav-item" type="button" onClick={() => document.getElementById('candidate-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} data-testid="nav-my-profile">
            <Code2 aria-hidden="true" /> My profile
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="profile-card">
          <div className="profile-avatar" aria-hidden="true">VS</div>
          <div>
            <div className="profile-name">V Sailatha</div>
            <div className="profile-caption">Candidate workspace</div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-top">
            <div className="brand-mark"><Sparkles size={17} /></div>
            <strong>Pathfinder</strong>
          </div>
          <div className="breadcrumb">Workspace <span aria-hidden="true">/</span> Opportunities</div>
          <div className="topbar-right">
            <div className="api-status" data-testid="status-api-availability" role="status">
              <span className={`status-dot ${health.isError ? 'offline' : ''}`} />
              {health.isLoading ? 'Checking letter service' : health.isError ? 'Letter service unavailable' : 'Letter service ready'}
            </div>
          </div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">Your next step starts here</div>
              <h1 className="page-title">Find work that fits<br className="desktop-break" /> what you can do.</h1>
              <p className="page-subtitle">Turn your skills into a short list of AI opportunities, then make every application sound like you.</p>
            </div>
            <div className="workspace-tag"><Activity size={15} /> Personal internship finder</div>
          </div>

          <div className="content-grid">
            <section className="panel profile-panel" id="candidate-profile" aria-labelledby="profile-heading">
              <div className="panel-heading">
                <div>
                  <h2 id="profile-heading">Your candidate profile</h2>
                  <p>A little context makes every match more useful.</p>
                </div>
                <span className="step-pill">Your details</span>
              </div>

              <label className="field-label" htmlFor="candidate-name">Candidate name</label>
              <input
                className="field-input"
                id="candidate-name"
                value={candidateName}
                onChange={(event) => setCandidateName(event.target.value)}
                placeholder="Your name"
                maxLength={100}
                data-testid="input-candidate-name"
              />

              <label className="field-label" htmlFor="skill-entry">Skills</label>
              <form className="skill-entry" onSubmit={addSkill}>
                <input
                  className="field-input"
                  id="skill-entry"
                  value={skillDraft}
                  onChange={(event) => setSkillDraft(event.target.value)}
                  placeholder="Add a skill, e.g. SQL"
                  maxLength={60}
                  aria-label="Add a skill"
                  data-testid="input-add-skill"
                />
                <button className="icon-button" type="submit" aria-label="Add skill" disabled={skills.length >= 12} data-testid="button-add-skill">
                  <Plus size={18} />
                </button>
              </form>
              <div className="skill-chips" aria-label="Your skills" data-testid="list-candidate-skills">
                {skills.map((skill) => (
                  <span className="skill-chip" key={skill} data-testid={`chip-skill-${skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                    {skill}
                    <button
                      className="chip-remove"
                      type="button"
                      aria-label={`Remove ${skill}`}
                      onClick={() => setSkills((current) => current.filter((item) => item !== skill))}
                      data-testid={`button-remove-skill-${skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
                {skills.length === 0 && <span className="hint" data-testid="text-no-skills">Add at least one skill to see relevant matches.</span>}
              </div>
              <div className="hint">Add up to 12 skills. Matches refresh as your profile changes.</div>

              <label className="field-label" htmlFor="experience">Experience or projects <span style={{ color: '#98a8b7', fontWeight: 500 }}>(optional)</span></label>
              <textarea
                className="field-textarea"
                id="experience"
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
                placeholder="Share a project, course, or experience you would like to highlight."
                maxLength={1200}
                data-testid="input-experience"
              />
              <div className="hint">This context is used to tailor your cover letter.</div>
              <div className="form-divider" />
              <button
                className="primary-button"
                type="button"
                onClick={() => setSearched(true)}
                disabled={skills.length === 0}
                data-testid="button-find-matches"
              >
                <Search size={16} /> Find my matches <ArrowRight size={15} />
              </button>
            </section>

            <section className="results-column" aria-labelledby="results-heading">
              <div className="results-toolbar">
                <div>
                  <div className="results-title" id="results-heading">Your matches <span style={{ color: '#91a2b2', fontSize: 13, fontWeight: 600 }}>{searched ? rankedInternships.length : 0}</span></div>
                  <div className="results-subtitle" data-testid="text-results-summary">{searched ? `Ranked against ${skills.length} ${skills.length === 1 ? 'skill' : 'skills'} in your profile` : 'Add skills to find your first matches'}</div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7 }} aria-label="Sort opportunities">
                  <ArrowDownUp size={14} color="#8295a7" />
                  <select className="sort-select" value={sortMode} onChange={(event) => setSortMode(event.target.value)} data-testid="select-sort-opportunities">
                    <option value="match">Best match</option>
                    <option value="stipend">Stipend</option>
                  </select>
                </label>
              </div>
              <div className="demo-notice" data-testid="notice-demo-results">
                <CheckCircle2 size={16} />
                <div><strong>Sample opportunities, thoughtfully matched.</strong> These demo listings are inspired by roles on Internshala and LinkedIn; they are not live listings or a live scrape.</div>
              </div>

              {!searched ? (
                <div className="panel empty-state" data-testid="state-ready-to-search">
                  <div className="empty-icon"><Target size={22} /></div>
                  <h3>Start with what you know</h3>
                  <p>Add your skills and select “Find my matches” to see a ranked shortlist built around your strengths.</p>
                </div>
              ) : skills.length === 0 ? (
                <div className="panel empty-state" data-testid="state-no-skills">
                  <div className="empty-icon"><Code2 size={22} /></div>
                  <h3>Your skills shape the search</h3>
                  <p>Add at least one skill to see which AI internships connect with your experience.</p>
                </div>
              ) : rankedInternships.length === 0 ? (
                <div className="panel empty-state" data-testid="state-no-matches">
                  <div className="empty-icon"><Search size={22} /></div>
                  <h3>No close matches yet</h3>
                  <p>Try adding a related skill such as Python, SQL, machine learning, or data analysis to broaden your shortlist.</p>
                </div>
              ) : (
                <div className="listing-list" data-testid="list-opportunities">
                  {rankedInternships.map(({ internship, matchedSkills, score }) => (
                    <article className="panel listing-card" key={internship.id} data-testid={`card-opportunity-${internship.id}`}>
                      <div className="listing-top">
                        <div className="company-line">
                          <div className="company-mark" aria-hidden="true">{internship.company.split(' ').map((word) => word[0]).slice(0, 2).join('')}</div>
                          <div>
                            <div className="company-name" data-testid={`text-company-${internship.id}`}>{internship.company}</div>
                            <div className="source-label" data-testid={`text-source-${internship.id}`}>Sample listing · {internship.source}</div>
                          </div>
                        </div>
                        <div className="match-badge" data-testid={`badge-match-${internship.id}`}><Target /> {score}% match</div>
                      </div>
                      <h3 className="role-title" data-testid={`text-role-${internship.id}`}>{internship.title}</h3>
                      <div className="meta-row">
                        <span className="meta-item"><MapPin />{internship.location}</span>
                        <span className="meta-item"><Clock3 />{internship.duration}</span>
                        <span className="meta-item"><BriefcaseBusiness />{internship.stipend}</span>
                      </div>
                      <p className="listing-desc">{internship.description}</p>
                      <div className="listing-skills" aria-label={`Skills for ${internship.title}`}>
                        {internship.skills.map((skill) => (
                          <span className={`listing-skill ${matchedSkills.includes(skill) ? 'matched' : ''}`} key={skill} data-testid={`skill-${internship.id}-${skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="listing-footer">
                        <span className="match-copy" data-testid={`text-overlap-${internship.id}`}><strong>{matchedSkills.length} skill{matchedSkills.length === 1 ? '' : 's'} matched</strong> in your profile</span>
                        <button
                          className="letter-button"
                          type="button"
                          onClick={() => requestLetter(internship)}
                          disabled={generatingId === internship.id || !candidateName.trim() || !skills.length}
                          data-testid={`button-generate-letter-${internship.id}`}
                        >
                          {generatingId === internship.id ? <Activity className="spin" /> : letters[internship.id] ? <CheckCircle2 /> : <WandSparkles />}
                          {generatingId === internship.id ? 'Writing your letter…' : letters[internship.id] ? 'Regenerate letter' : 'Write my cover letter'}
                        </button>
                      </div>
                      {letters[internship.id] && (
                        <div className="letter-output" data-testid={`panel-letter-${internship.id}`}>
                          <div className="letter-output-head">
                            <div className="letter-output-title"><FileText size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />Your tailored draft</div>
                            <button className="copy-button" type="button" onClick={() => void copyLetter(internship.id)} data-testid={`button-copy-letter-${internship.id}`}>
                              {copiedId === internship.id ? <Check size={13} /> : <ClipboardCopy size={13} />}
                              {copiedId === internship.id ? 'Copied' : 'Copy letter'}
                            </button>
                          </div>
                          <p className="letter-copy" data-testid={`text-letter-${internship.id}`}>{letters[internship.id]}</p>
                          {copiedId === internship.id && <div className="hint" role="status" data-testid={`status-copied-${internship.id}`}>Letter copied to clipboard.</div>}
                        </div>
                      )}
                      {letterErrors[internship.id] && (
                        <div className="letter-error" role="alert" data-testid={`error-letter-${internship.id}`}>{letterErrors[internship.id]}</div>
                      )}
                    </article>
                  ))}
                </div>
              )}
              <div className="footer-note">Sample opportunities for exploration · Always confirm details with the original listing source.</div>
            </section>
          </div>
        </div>
    </main>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
