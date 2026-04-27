import './globals.css';
import Providers from '@/components/providers';

export const metadata = {
  title: 'Profile Stream',
  description: 'AI-powered resume parsing and candidate scoring',
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
