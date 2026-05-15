import Link from 'next/link';

export default function PortfolioNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] px-4">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6" aria-hidden="true">
        <rect x="10" y="6" width="36" height="46" rx="4" fill="#D1DCE8" />
        <rect x="16" y="16" width="18" height="3" rx="1.5" fill="white" opacity="0.7" />
        <rect x="16" y="23" width="24" height="3" rx="1.5" fill="white" opacity="0.7" />
        <rect x="16" y="30" width="14" height="3" rx="1.5" fill="white" opacity="0.7" />
        <circle cx="46" cy="46" r="14" fill="#F9FAFB" stroke="#D1DCE8" strokeWidth="2" />
        <text x="46" y="51" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#6B7280" fontFamily="sans-serif">?</text>
      </svg>
      <h1 className="text-2xl font-bold text-[#2C2C2A] mb-3">Portfolio not found</h1>
      <p className="text-base text-[#6B7280] max-w-sm text-center mb-6">
        This portfolio doesn&apos;t exist or may have been unpublished.
      </p>
      <Link href="/home" className="bg-[#185FA5] text-white px-6 py-2.5 rounded-lg font-medium text-sm mt-4 inline-block hover:bg-[#0C447C] transition-colors">
        Go to Proflect
      </Link>
    </div>
  );
}
