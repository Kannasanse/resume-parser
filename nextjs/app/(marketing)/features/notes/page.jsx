import FeaturePageLayout from '@/components/marketing/FeaturePageLayout';
import FeatureHero from '@/components/marketing/FeatureHero';
import FeatureBenefits from '@/components/marketing/FeatureBenefits';
import FeatureDeepDive from '@/components/marketing/FeatureDeepDive';
import FeatureCTABanner from '@/components/marketing/FeatureCTABanner';

export const metadata = {
  title: 'Notes — Proflect',
  description: 'A Notion-style block editor built into Proflect. 44 block types, wikilinks, tags, full-text search, and public sharing.',
};

const ACCENT = '#7C3AED';

const BENEFITS = [
  {
    icon: '🔗',
    title: 'Wikilinks',
    body: 'Link any note to another with [[double brackets]]. Build a personal knowledge graph.',
  },
  {
    icon: '🔍',
    title: 'Full-text Search',
    body: 'Search across all your notes instantly. Every word, every block, every tag — always findable.',
  },
  {
    icon: '🌐',
    title: 'Public Sharing',
    body: 'Share any note publicly with one click. Anyone with the link can read it — no account needed.',
  },
];

const DEEP_DIVE = [
  {
    eyebrow: '44 BLOCK TYPES',
    heading: 'Code, tables, callouts, math, embeds, and more.',
    body: 'Type / to insert any block — paragraphs, headings, code, tables, callouts, LaTeX math, and more. Everything you need to capture any idea.',
    imageLabel: 'Block editor · slash menu',
  },
  {
    eyebrow: 'TAGS & SEARCH',
    heading: 'Tag notes with #hashtags. Search everything instantly.',
    body: 'Add tags to organise your notes. Full-text search covers every word in every block — find anything in milliseconds.',
    imageLabel: 'Search results · tag filter',
  },
  {
    eyebrow: 'WIKILINKS',
    heading: 'Connect notes together. Build your second brain.',
    body: 'Type [[ to link any note to another. See backlinks to understand which notes reference each other. Your notes become a connected knowledge graph.',
    imageLabel: 'Note with wikilinks · backlinks panel',
  },
];

export default function NotesPage() {
  return (
    <FeaturePageLayout featureName="Notes" appHref="/notes">
      <FeatureHero
        eyebrow="LEARNING · NOTES"
        heading={"Notes that connect\nyour ideas."}
        sub="A Notion-style block editor built into Proflect. 44 block types, wikilinks, tags, full-text search, and public sharing."
        screenshotLabel="Notes"
        featureName="Notes"
        appHref="/notes"
        accentColor={ACCENT}
        featureSlug="notes"
      />
      <FeatureBenefits benefits={BENEFITS} />
      <FeatureDeepDive sections={DEEP_DIVE} accentColor={ACCENT} featureSlug="notes" />
      <FeatureCTABanner featureName="Notes" appHref="/notes" />
    </FeaturePageLayout>
  );
}
