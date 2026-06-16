export function formatEmploymentType(type) {
  const map = { FULLTIME: 'Full-time', PARTTIME: 'Part-time', CONTRACT: 'Contract', INTERN: 'Internship' };
  return map[type] ?? type ?? 'Full-time';
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function formatSalary(min, max, currency = 'INR', period = 'YEAR') {
  if (!min) return null;
  const suffix = { YEAR: '/yr', MONTH: '/mo', HOUR: '/hr' }[period] ?? '';
  const fmt = (n) => {
    if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000)   return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };
  const sym = currency === 'INR' ? '₹' : `${currency} `;
  if (max && max !== min) return `${sym}${fmt(min)}–${fmt(max)}${suffix}`;
  return `${sym}${fmt(min)}${suffix}`;
}
