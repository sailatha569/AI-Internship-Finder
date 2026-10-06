export type Internship = {
  id: string;
  title: string;
  company: string;
  source: 'Internshala' | 'LinkedIn';
  location: string;
  duration: string;
  stipend: string;
  description: string;
  skills: string[];
};

export const sampleInternships: Internship[] = [
  {
    id: 'ml-research-assistant',
    title: 'Machine Learning Research Intern',
    company: 'Aster Labs',
    source: 'Internshala',
    location: 'Bengaluru · Hybrid',
    duration: '6 months',
    stipend: '₹18,000 / month',
    description: 'Support applied research experiments, prepare clean datasets, and help translate model findings into clear technical notes.',
    skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
  },
  {
    id: 'ai-product',
    title: 'AI Product Intern',
    company: 'Northstar Digital',
    source: 'LinkedIn',
    location: 'Remote · India',
    duration: '4 months',
    stipend: '₹15,000 / month',
    description: 'Work alongside product and engineering teams to evaluate AI features, prototype user flows, and make data-informed recommendations.',
    skills: ['Product Thinking', 'Python', 'Machine Learning', 'Communication'],
  },
  {
    id: 'data-science',
    title: 'Data Science Intern',
    company: 'Meridian Analytics',
    source: 'Internshala',
    location: 'Hyderabad · On-site',
    duration: '3 months',
    stipend: '₹12,000 / month',
    description: 'Explore business datasets, build predictive models, and share practical insights with a small analytics team.',
    skills: ['Python', 'SQL', 'Data Analysis', 'Statistics'],
  },
  {
    id: 'nlp-engineering',
    title: 'NLP Engineering Intern',
    company: 'Verba AI',
    source: 'LinkedIn',
    location: 'Pune · Hybrid',
    duration: '5 months',
    stipend: '₹20,000 / month',
    description: 'Help build language-powered tools through thoughtful evaluation, prompt experiments, and lightweight model pipelines.',
    skills: ['Python', 'NLP', 'Machine Learning', 'Git'],
  },
  {
    id: 'computer-vision',
    title: 'Computer Vision Intern',
    company: 'Luma Robotics',
    source: 'Internshala',
    location: 'Chennai · Hybrid',
    duration: '6 months',
    stipend: '₹16,000 / month',
    description: 'Prototype vision workflows for real-world robotics problems and document what works through repeatable experiments.',
    skills: ['Python', 'Computer Vision', 'Machine Learning', 'OpenCV'],
  },
  {
    id: 'data-analyst',
    title: 'AI & Data Analyst Intern',
    company: 'Brightpath Systems',
    source: 'LinkedIn',
    location: 'Remote · India',
    duration: '3 months',
    stipend: '₹10,000 / month',
    description: 'Turn product questions into useful analysis, dashboards, and clear recommendations for a growing AI team.',
    skills: ['SQL', 'Data Analysis', 'Python', 'Excel'],
  },
];
