import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserListsProvider } from '@/contexts/UserListsContext';

export const metadata: Metadata = {
  title: 'Demand - Company Political Analysis',
  description: 'Discover the political affiliations, donations, and positions of companies based on public records and news.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Demand',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Demand - Company Political Analysis',
    description: 'Discover the political affiliations, donations, and positions of companies based on public records and news.',
    images: [
      {
        url: '/demand-dark-big.png',
        width: 1200,
        height: 630,
        alt: 'Demand',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Demand - Company Political Analysis',
    description: 'Discover the political affiliations, donations, and positions of companies based on public records and news.',
    images: ['/demand-dark-big.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <UserListsProvider>
            {children}
          </UserListsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
