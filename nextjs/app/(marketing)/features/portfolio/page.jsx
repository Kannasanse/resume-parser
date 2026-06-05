import FeaturePageLayout from '@/components/marketing/FeaturePageLayout';
import FeatureHero from '@/components/marketing/FeatureHero';
import FeatureBenefits from '@/components/marketing/FeatureBenefits';
import FeatureDeepDive from '@/components/marketing/FeatureDeepDive';
import FeatureSocialProof from '@/components/marketing/FeatureSocialProof';
import FeatureCTABanner from '@/components/marketing/FeatureCTABanner';

export const metadata = {
  title: 'Portfolio Builder — Proflect',
  description: 'Build a portfolio website that showcases your projects, skills, and experience. No code required.',
};

const ACCENT = '#185FA5';

const BENEFITS = [
  {
    icon: '🌐',
    title: 'Custom URL',
    body: 'Get a shareable link at proflect.app/[yourname] instantly.',
  },
  {
    icon: '✨',
    title: 'AI-Assisted',
    body: 'Describe your project and AI writes the copy for you.',
  },
  {
    icon: '📱',
    title: 'Mobile Ready',
    body: 'Every portfolio looks great on any device, automatically.',
  },
];

const DEEP_DIVE = [
  {
    eyebrow: 'ADD YOUR WORK',
    heading: 'Projects, skills, and experience — all in one place.',
    body: 'Add your projects with descriptions, images, and links. AI helps you write compelling copy so every project sounds its best.',
    imageLabel: 'Portfolio editor · add project',
  },
  {
    eyebrow: 'CUSTOMISE',
    heading: 'Choose from themes and layouts that match your style.',
    body: 'Switch between clean, bold, or creative themes. Every change updates in real-time — no code, no exports.',
    imageLabel: 'Theme selection panel',
  },
  {
    eyebrow: 'SHARE',
    heading: 'One link to share with recruiters, clients, or anyone.',
    body: 'Your portfolio lives at a permanent public URL. Share it on LinkedIn, in emails, or anywhere you want to be found.',
    imageLabel: 'Public portfolio view',
  },
];

export default function PortfolioPage() {
  return (
    <FeaturePageLayout featureName="Portfolio" appHref="/portfolios">
      <FeatureHero
        eyebrow="WORKSPACE · PORTFOLIO"
        heading={"Your work, published\nin minutes."}
        sub="Build a portfolio website that showcases your projects, skills, and experience. No code required."
        screenshotLabel="Portfolio Builder"
        featureName="Portfolio"
        appHref="/portfolios"
        accentColor={ACCENT}
        featureSlug="portfolio"
      />
      <FeatureBenefits benefits={BENEFITS} />
      <FeatureDeepDive sections={DEEP_DIVE} accentColor={ACCENT} featureSlug="portfolio" />
      <FeatureSocialProof />
      <FeatureCTABanner featureName="Portfolio" appHref="/portfolios" />
    </FeaturePageLayout>
  );
}
