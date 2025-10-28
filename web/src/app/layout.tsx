import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Nuelink Clone',
  description: 'All your links. One place.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background-light text-text-light antialiased">
        {children}
      </body>
    </html>
  );
}