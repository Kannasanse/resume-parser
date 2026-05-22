import NoteEditorPanel from '../components/NoteEditorPanel';

export const metadata = { title: 'Note — Proflect' };

export default function NotePage({ params }) {
  return (
    <div className="h-screen bg-white dark:bg-[#111F35]">
      <NoteEditorPanel noteId={params.noteId} onNoteUpdated={() => {}} />
    </div>
  );
}
