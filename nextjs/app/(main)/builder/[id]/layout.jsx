// Override the main layout's padding so the editor fills the viewport
export default function BuilderEditorLayout({ children }) {
  return (
    <div className="-mx-4 -mt-4 sm:-mt-8 overflow-hidden">
      {children}
    </div>
  );
}
