import './globals.css';
import Providers from '@/components/providers';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
        <SpeedInsights />
      </body>
    </html>
  );
}
