import Navbar from '@/components/Navbar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-ds-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
