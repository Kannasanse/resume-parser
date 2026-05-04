// Shared skeleton primitive — compose to build page-level loading states
export function Sk({ className = '' }) {
  return <div className={`bg-ds-border/60 rounded-md animate-pulse ${className}`} />;
}
