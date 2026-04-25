import './globals.css';
import Providers from '@/components/providers';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'resume.parse',
  description: 'AI-powered resume parser and candidate scoring',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="min-h-screen bg-ds-bg">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
