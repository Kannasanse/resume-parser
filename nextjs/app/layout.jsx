import './globals.css';
import Providers from '@/components/providers';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'Proflect',
  description: 'AI-powered resume parsing and candidate scoring',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
