import type { Metadata } from 'next';

import { Toaster } from '@/components/ui/toaster';
import { APP_NAME } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Non-custodial Bitcoin invoicing with fast quote generation and shareable links.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

const themeBootstrapScript = `
(function () {
  try {
    var stored = window.localStorage.getItem('nodeinvoice-theme');
    var root = document.documentElement;
    if (stored === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  } catch (error) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-body antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
