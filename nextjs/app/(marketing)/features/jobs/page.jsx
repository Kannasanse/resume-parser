import FeaturePageLayout from '@/components/marketing/FeaturePageLayout';
import FeatureHero from '@/components/marketing/FeatureHero';
import FeatureBenefits from '@/components/marketing/FeatureBenefits';
import FeatureDeepDive from '@/components/marketing/FeatureDeepDive';
import FeatureSocialProof from '@/components/marketing/FeatureSocialProof';
import FeatureCTABanner from '@/components/marketing/FeatureCTABanner';

export const metadata = {
  title: 'Job Recommendations — Proflect',
  description: 'See live job listings based on your job title and location. Remote and on-site roles, updated every few hours. Apply directly from Proflect.',
};

const ACCENT = '#185FA5';

const BENEFITS = [
  {
    icon: '💼',
    title: 'Matched to You',
    body: 'Jobs filtered by your actual job title and location — not generic search results.',
  },
  {
    icon: '🔄',
    title: 'Always Fresh',
    body: 'Listings updated every 12 hours. No stale postings from months ago.',
  },
  {
    icon: '🚀',
    title: 'Apply Directly',
    body: 'Click to apply on the original job page. Save jobs to review later.',
  },
];

const DEEP_DIVE = [
  {
    eyebrow: 'YOUR PROFILE',
    heading: 'Set your job title and location once. Jobs come to you.',
    body: 'Enter your current or target job title and location. Proflect fetches matching roles and surfaces the most relevant ones at the top.',
    imageLabel: 'Job preferences setup',
  },
  {
    eyebrow: 'LIVE LISTINGS',
    heading: 'Real postings from LinkedIn, Indeed, and more.',
    body: 'Job listings are pulled from multiple sources and refreshed throughout the day. Remote and on-site roles are clearly labelled.',
    imageLabel: 'Job listings grid',
  },
  {
    eyebrow: 'SAVE & APPLY',
    heading: 'Bookmark roles and apply when you\'re ready.',
    body: 'Save any job to your shortlist. When you\'re ready to apply, click through to the original posting with one tap.',
    imageLabel: 'Saved jobs view',
  },
];

export default function JobsPage() {
  return (
    <FeaturePageLayout featureName="Job Recommendations" appHref="/job-recommendations">
      <FeatureHero
        eyebrow="OPPORTUNITY · JOBS"
        heading={"Jobs matched to\nyour profile."}
        sub="See live job listings based on your job title and location. Remote and on-site roles, updated every few hours. Apply directly from Proflect."
        screenshotLabel="Job Recommendations"
        featureName="Job Recommendations"
        appHref="/job-recommendations"
        accentColor={ACCENT}
        featureSlug="jobs"
      />
      <FeatureBenefits benefits={BENEFITS} />
      <FeatureDeepDive sections={DEEP_DIVE} accentColor={ACCENT} featureSlug="jobs" />
      <FeatureSocialProof />
      <FeatureCTABanner featureName="Job Recommendations" appHref="/job-recommendations" />
    </FeaturePageLayout>
  );
}
