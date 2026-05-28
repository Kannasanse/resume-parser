export function ProcessingState({ message = 'Processing your file…', hint = 'This may take a few seconds' }) {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[#E6F1FB] border-t-[#185FA5] animate-spin" />
      <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">{message}</p>
      {hint && <p className="text-xs text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  );
}
