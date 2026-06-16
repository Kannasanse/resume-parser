'use client';
import Link from 'next/link';

export function ToolCard({ icon, name, description, href, gradient = 'from-[#E6F1FB] to-[#D4E8F8]' }) {
  return (
    <Link
      href={href}
      className="group flex flex-col bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-2xl p-6 cursor-pointer transition-all duration-[220ms] hover:-translate-y-0.5 hover:shadow-md hover:border-[rgba(24,95,165,0.30)]"
    >
      <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 flex-shrink-0 text-[#185FA5]`}>
        {icon}
      </div>
      <p className="text-base font-bold text-[#2C2C2A] dark:text-[#E8EFF7] leading-snug">{name}</p>
      <p className="text-[13px] text-[#6B7280] dark:text-[#8BA3C1] mt-1 flex-1">{description}</p>
      <span className="text-sm text-[#185FA5] mt-4 group-hover:underline">→ Open tool</span>
    </Link>
  );
}
