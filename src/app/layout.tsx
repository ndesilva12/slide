import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserListsProvider } from '@/contexts/UserListsContext';

export const metadata: Metadata = {
  title: 'Scale - Company Political Analysis',
  description: 'Discover the political affiliations, donations, and positions of companies based on public records and news.',
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
