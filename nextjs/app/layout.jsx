import './globals.css';
import Providers from '@/components/providers';

export const metadata = {
  title: 'Profile Stream',
  description: 'AI-powered resume parsing and candidate scoring',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
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
