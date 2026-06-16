import FeaturePageLayout from '@/components/marketing/FeaturePageLayout';
import FeatureHero from '@/components/marketing/FeatureHero';
import FeatureBenefits from '@/components/marketing/FeatureBenefits';
import FeatureDeepDive from '@/components/marketing/FeatureDeepDive';
import FeatureCTABanner from '@/components/marketing/FeatureCTABanner';

export const metadata = {
  title: 'My Courses — Proflect',
  description: 'AI-generated study plans for any skill or career goal. Web-sourced content, YouTube tutorials, and practice exercises — structured for your level.',
};

const ACCENT = '#1D9E75';

const BENEFITS = [
  {
    icon: '✦',
    title: 'Skill-Based Creation',
    body: 'Type any skill — React, SQL, System Design — and get a full structured course in seconds.',
  },
  {
    icon: '🌐',
    title: 'Web-Sourced Content',
    body: 'Content pulled from trusted educational sites, not just AI-generated text. Real articles, real examples.',
  },
  {
    icon: '📹',
    title: 'Video Tutorials',
    body: 'YouTube tutorials auto-fetched for every section so you always have a video alongside the text.',
  },
];

const DEEP_DIVE = [
  {
    eyebrow: 'STRUCTURED LEARNING',
    heading: 'Phase-based: Beginner → Intermediate → Advanced.',
    body: 'Every course is organised into phases. Each phase has topics, each topic has concept sections, practical walkthroughs, exercises, and a summary.',
    imageLabel: 'Course structure · phase view',
  },
  {
    eyebrow: 'REAL CONTENT',
    heading: 'Web sources + AI synthesis + YouTube, per section.',
    body: 'Concept and practical sections pull from real web sources. AI synthesises them into a coherent lesson. YouTube videos are fetched automatically.',
    imageLabel: 'Section content · sources view',
  },
  {
    eyebrow: 'TRACK PROGRESS',
    heading: 'Mark sections complete and pick up where you left off.',
    body: 'Every section has a completion checkbox. Your progress is saved automatically. Come back anytime and continue exactly where you stopped.',
    imageLabel: 'Progress tracking view',
  },
];

export default function CoursesPage() {
  return (
    <FeaturePageLayout featureName="My Courses" appHref="/my-courses">
      <FeatureHero
        eyebrow="LEARNING · COURSES"
        heading={"Learn any skill.\nOn your terms."}
        sub="AI-generated study plans for any skill or career goal. Web-sourced content, YouTube tutorials, and practice exercises — all structured for your level."
        screenshotLabel="My Courses"
        featureName="My Courses"
        appHref="/my-courses"
        accentColor={ACCENT}
        featureSlug="courses"
      />
      <FeatureBenefits benefits={BENEFITS} />
      <FeatureDeepDive sections={DEEP_DIVE} accentColor={ACCENT} featureSlug="courses" />
      <FeatureCTABanner featureName="My Courses" appHref="/my-courses" />
    </FeaturePageLayout>
  );
}
