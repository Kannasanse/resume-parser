export default function NotesEmptyState({ onCreateNote, hasNotes }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <span className="text-6xl">📓</span>
      {hasNotes ? (
        <>
          <h3 className="text-lg font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">
            Select a note
          </h3>
          <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1]">
            Choose a note from the sidebar or create a new one
          </p>
        </>
      ) : (
        <>
          <h3 className="text-[22px] font-bold text-[#2C2C2A] dark:text-[#E8EFF7]">
            Your notes, organised
          </h3>
          <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1] max-w-xs">
            Capture ideas, study notes, and thoughts. Use / to insert any block type.
          </p>
        </>
      )}
      <button
        onClick={onCreateNote}
        className="btn-primary px-6 py-2.5 text-sm font-semibold"
      >
        {hasNotes ? 'New note' : 'Create your first note'}
      </button>
    </div>
  );
}
