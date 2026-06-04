import FeaturePageLayout from '@/components/marketing/FeaturePageLayout';
import FeatureHero from '@/components/marketing/FeatureHero';
import FeatureBenefits from '@/components/marketing/FeatureBenefits';
import FeatureDeepDive from '@/components/marketing/FeatureDeepDive';
import FeatureSocialProof from '@/components/marketing/FeatureSocialProof';
import FeatureCTABanner from '@/components/marketing/FeatureCTABanner';

export const metadata = {
  title: 'Resume Builder — Proflect',
  description: '24 ATS-optimised templates, live preview, PDF and Word export. Built with the keywords recruiters search for.',
};

const ACCENT = '#185FA5';

const BENEFITS = [
  {
    icon: '📄',
    title: '24 Templates',
    body: 'Professional designs from minimal to bold. Switch templates without losing any of your content.',
  },
  {
    icon: '🎯',
    title: 'ATS Optimised',
    body: 'Every template passes Applicant Tracking System parsing. No columns, tables, or images that break ATS scanners.',
  },
  {
    icon: '⚡',
    title: 'Live Preview',
    body: 'See every change instantly as you type. Export to PDF or Word in one click.',
  },
];

const DEEP_DIVE = [
  {
    eyebrow: 'SMART EDITOR',
    heading: 'Type once. Format automatically.',
    body: 'The resume editor handles spacing, font sizes, and section ordering so you can focus on your content, not the design.',
    imageLabel: 'Resume editor · close-up',
  },
  {
    eyebrow: 'ATS SCORING',
    heading: 'Know your score before you apply.',
    body: 'Paste any job description and instantly see how well your resume matches. Get a list of missing keywords and suggested improvements.',
    imageLabel: 'ATS score results panel',
  },
  {
    eyebrow: 'EXPORT',
    heading: 'PDF, Word, and more.',
    body: 'Export your resume in PDF or DOCX format. Share a public link directly from Proflect.',
    imageLabel: 'Export dialog',
  },
];

export default function ResumeBuilderPage() {
  return (
    <FeaturePageLayout featureName="Resume Builder" appHref="/builder">
      <FeatureHero
        eyebrow="WORKSPACE · RESUME BUILDER"
        heading={"A resume that gets\nyou noticed."}
        sub="24 ATS-optimised templates, live preview, PDF and Word export. Built with the keywords recruiters search for."
        screenshotLabel="Resume Builder"
        featureName="Resume Builder"
        appHref="/builder"
        accentColor={ACCENT}
        featureSlug="resume-builder"
      />
      <FeatureBenefits benefits={BENEFITS} />
      <FeatureDeepDive sections={DEEP_DIVE} accentColor={ACCENT} />
      <FeatureSocialProof />
      <FeatureCTABanner featureName="Resume Builder" appHref="/builder" />
    </FeaturePageLayout>
  );
}
