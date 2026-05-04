// No navbar or padding — just the raw page content
export default function PrintLayout({ children }) {
  return <div style={{ margin: 0, padding: 0 }}>{children}</div>;
}
