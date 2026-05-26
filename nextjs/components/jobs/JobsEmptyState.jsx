import Link from 'next/link';

function BriefcaseIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <path d="M2 13h20"/>
    </svg>
  );
}

export default function JobsEmptyState({ reason, message }) {
  if (reason === 'incomplete_profile') {
    return (
      <div className="rounded-2xl border border-dashed border-[#D1DCE8] dark:border-white/10 p-10 text-center">
        <div className="text-[#D1DCE8] dark:text-white/20 mx-auto mb-3 w-fit">
          <BriefcaseIcon />
        </div>
        <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] mb-1">
          Set up your profile to see job recommendations
        </p>
        <p className="text-xs text-[#9CA3AF] mb-5">
          {message || 'Add your job title and location to get personalised job listings.'}
        </p>
        <Link
          href="/profile"
          className="inline-flex items-center text-sm font-semibold text-[#185FA5] hover:underline"
        >
          Complete your profile →
        </Link>
      </div>
    );
  }

  if (reason === 'no_results') {
    return (
      <div className="rounded-2xl border border-dashed border-[#D1DCE8] dark:border-white/10 p-10 text-center">
        <div className="text-[#D1DCE8] dark:text-white/20 mx-auto mb-3 w-fit">
          <BriefcaseIcon />
        </div>
        <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] mb-1">
          No matching jobs found
        </p>
        <p className="text-xs text-[#9CA3AF]">
          Try updating your profile headline or check back later.
        </p>
      </div>
    );
  }

  return null;
}
