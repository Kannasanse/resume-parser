import FeaturePageLayout from '@/components/marketing/FeaturePageLayout';
import FeatureHero from '@/components/marketing/FeatureHero';
import FeatureBenefits from '@/components/marketing/FeatureBenefits';
import FeatureDeepDive from '@/components/marketing/FeatureDeepDive';
import FeatureSocialProof from '@/components/marketing/FeatureSocialProof';
import FeatureCTABanner from '@/components/marketing/FeatureCTABanner';

export const metadata = {
  title: 'ATS Score — Proflect',
  description: 'Paste any job description. See exactly how well your resume matches — with a breakdown of missing keywords and a relevance score.',
};

const ACCENT = '#1D9E75';

const BENEFITS = [
  {
    icon: '⚡',
    title: 'Instant Analysis',
    body: 'Paste a job description and get your score in under 10 seconds.',
  },
  {
    icon: '🎯',
    title: 'Keyword Breakdown',
    body: 'See which keywords are present, which are missing, and how important each one is.',
  },
  {
    icon: '📈',
    title: 'Improve Your Score',
    body: 'Specific suggestions for improving your resume for that exact role.',
  },
];

const DEEP_DIVE = [
  {
    eyebrow: 'PASTE THE JOB DESCRIPTION',
    heading: 'Any job posting works — LinkedIn, Naukri, anywhere.',
    body: 'Copy and paste any job description. Proflect parses the role requirements, required skills, and keywords automatically.',
    imageLabel: 'Job description paste panel',
  },
  {
    eyebrow: 'SEE YOUR SCORE',
    heading: 'A relevance percentage + matched and missing keywords.',
    body: 'Your resume is scored against the job description. See a clear list of keywords you already have and the gaps you need to close.',
    imageLabel: 'ATS score · keyword breakdown',
  },
  {
    eyebrow: 'IMPROVE YOUR RESUME',
    heading: 'Targeted suggestions to close the gap.',
    body: 'Get specific recommendations for which sections to update and exactly which keywords to add — so every application is as strong as it can be.',
    imageLabel: 'Improvement suggestions panel',
  },
];

export default function ATSScorePage() {
  return (
    <FeaturePageLayout featureName="ATS Score" appHref="/resumes">
      <FeatureHero
        eyebrow="OPPORTUNITY · ATS SCORE"
        heading={"Know your score\nbefore you apply."}
        sub="Paste any job description. See exactly how well your resume matches — with a breakdown of missing keywords and a relevance score."
        screenshotLabel="ATS Score"
        featureName="ATS Score"
        appHref="/resumes"
        accentColor={ACCENT}
        featureSlug="ats-score"
      />
      <FeatureBenefits benefits={BENEFITS} />
      <FeatureDeepDive sections={DEEP_DIVE} accentColor={ACCENT} featureSlug="ats-score" />
      <FeatureSocialProof />
      <FeatureCTABanner featureName="ATS Score" appHref="/resumes" />
    </FeaturePageLayout>
  );
}
