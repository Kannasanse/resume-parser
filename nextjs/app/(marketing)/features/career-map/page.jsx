import FeaturePageLayout from '@/components/marketing/FeaturePageLayout';
import FeatureHero from '@/components/marketing/FeatureHero';
import FeatureBenefits from '@/components/marketing/FeatureBenefits';
import FeatureDeepDive from '@/components/marketing/FeatureDeepDive';
import FeatureSocialProof from '@/components/marketing/FeatureSocialProof';
import FeatureCTABanner from '@/components/marketing/FeatureCTABanner';

export const metadata = {
  title: 'Career Map — Proflect',
  description: 'Upload your resume, answer a few questions, and get a visual map of where your career could go — with a learning plan to get there.',
};

const ACCENT = '#1D9E75';

const BENEFITS = [
  {
    icon: '🗺',
    title: 'Visual Career Paths',
    body: 'Three types of moves: vertical (promotion), horizontal (pivot), and diagonal (combination). All mapped from your current role.',
  },
  {
    icon: '✦',
    title: 'AI-Generated Plans',
    body: 'Each path comes with a personalised study plan — web-sourced content and YouTube tutorials included.',
  },
  {
    icon: '🎯',
    title: 'Adaptive Assessment',
    body: '10-question adaptive quiz that understands your goals, timeline, and constraints before recommending paths.',
  },
];

const DEEP_DIVE = [
  {
    eyebrow: 'UPLOAD YOUR RESUME',
    heading: 'We extract your skills, experience, and trajectory.',
    body: 'Drop in your resume and our AI builds a detailed profile — your current skills, seniority, domain, and career signals — in seconds.',
    imageLabel: 'Resume upload · profile extraction',
  },
  {
    eyebrow: 'GET YOUR MAP',
    heading: 'A visual graph of career moves tailored to your profile.',
    body: 'See exactly which roles you can reach — near-term and long-term — with transition likelihood and salary range for each.',
    imageLabel: 'Career path graph',
  },
  {
    eyebrow: 'START LEARNING',
    heading: 'Each path generates a study plan with real content.',
    body: 'Pick a target role and get a full curriculum: web-sourced articles, YouTube tutorials, and practice exercises — structured for your current level.',
    imageLabel: 'Study plan · course view',
  },
];

export default function CareerMapPage() {
  return (
    <FeaturePageLayout featureName="Career Map" appHref="/career-map">
      <FeatureHero
        eyebrow="WORKSPACE · CAREER MAP"
        heading={"See every path your\ncareer could take."}
        sub="Upload your resume, answer a few questions, and get a visual map of where your career could go — with a learning plan to get there."
        screenshotLabel="Career Map"
        featureName="Career Map"
        appHref="/career-map"
        accentColor={ACCENT}
        featureSlug="career-map"
      />
      <FeatureBenefits benefits={BENEFITS} />
      <FeatureDeepDive sections={DEEP_DIVE} accentColor={ACCENT} />
      <FeatureSocialProof />
      <FeatureCTABanner featureName="Career Map" appHref="/career-map" />
    </FeaturePageLayout>
  );
}
