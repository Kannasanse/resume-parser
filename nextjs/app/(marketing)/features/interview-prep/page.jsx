import FeaturePageLayout from '@/components/marketing/FeaturePageLayout';
import FeatureHero from '@/components/marketing/FeatureHero';
import FeatureBenefits from '@/components/marketing/FeatureBenefits';
import FeatureDeepDive from '@/components/marketing/FeatureDeepDive';
import FeatureSocialProof from '@/components/marketing/FeatureSocialProof';
import FeatureCTABanner from '@/components/marketing/FeatureCTABanner';

export const metadata = {
  title: 'Interview Prep — Proflect',
  description: 'Three assessment modes, scenario-based questions, and a shared question library that gets smarter with every quiz taken.',
};

const ACCENT = '#F59E0B';

const BENEFITS = [
  {
    icon: '🎤',
    title: 'Voice Mode',
    body: 'Speak your answers. Get feedback on content accuracy AND delivery — pace, filler words, answer length.',
  },
  {
    icon: '🎯',
    title: 'Scenario Questions',
    body: 'Medium and hard difficulty uses real-world scenarios, not just definitions. Prepare for the real thing.',
  },
  {
    icon: '📚',
    title: 'Shared Library',
    body: 'Every question generated is saved to a shared library. Better questions for everyone, every session.',
  },
];

const DEEP_DIVE = [
  {
    eyebrow: 'THREE MODES',
    heading: 'By skill, by job description, or by your own study content.',
    body: 'Practice for a specific skill, paste a job description to get role-specific questions, or quiz yourself on your own notes and courses.',
    imageLabel: 'Mode selection screen',
  },
  {
    eyebrow: 'VOICE ASSESSMENT',
    heading: 'Speak your answers. AI evaluates content + delivery.',
    body: 'Record your spoken answer and get feedback on both technical accuracy and how you communicated it — filler words, pacing, length.',
    imageLabel: 'Voice recording · assessment',
  },
  {
    eyebrow: 'RESULTS & REVIEW',
    heading: 'See what you got right, what you missed, and why.',
    body: 'After each session, review every question with the model answer side-by-side. Identify gaps and focus your next practice session.',
    imageLabel: 'Results review screen',
  },
];

export default function InterviewPrepPage() {
  return (
    <FeaturePageLayout featureName="Interview Prep" appHref="/self-test">
      <FeatureHero
        eyebrow="LEARNING · INTERVIEW PREP"
        heading={"Practice interviews\nthat actually prepare you."}
        sub="Three assessment modes, scenario-based questions, and a shared question library that gets smarter with every quiz taken."
        screenshotLabel="Interview Prep"
        featureName="Interview Prep"
        appHref="/self-test"
        accentColor={ACCENT}
        featureSlug="interview-prep"
      />
      <FeatureBenefits benefits={BENEFITS} />
      <FeatureDeepDive sections={DEEP_DIVE} accentColor={ACCENT} featureSlug="interview-prep" />
      <FeatureSocialProof />
      <FeatureCTABanner featureName="Interview Prep" appHref="/self-test" />
    </FeaturePageLayout>
  );
}
