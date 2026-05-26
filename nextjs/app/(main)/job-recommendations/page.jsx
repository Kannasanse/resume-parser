import JobsGrid from '@/components/jobs/JobsGrid';

export const metadata = { title: 'Jobs for you — Proflect' };

export default function JobRecommendationsPage() {
  return (
    <div className="gradient-mesh-1 min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-gradient-primary">Jobs for you</h1>
        <p className="text-sm text-[var(--ds-textMuted)] mt-0.5">
          Personalised job listings based on your profile
        </p>
      </div>

      <JobsGrid />
    </div>
  );
}
