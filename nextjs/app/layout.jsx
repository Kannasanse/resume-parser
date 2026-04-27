import './globals.css';
import Providers from '@/components/providers';

export const metadata = {
  title: 'resume.parse',
  description: 'AI-powered resume parser and candidate scoring',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
