import './globals.css';
import type { ReactNode } from 'react';
import { inter, montserrat, nunito, poppins } from '@/src/lib/fonts';

export const metadata = {
  title: 'Nuelink Clone',
  description: 'All your links. One place.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fontVars = `${inter.variable} ${poppins.variable} ${montserrat.variable} ${nunito.variable}`;
  return (
    <html lang="en">
      <body className={`min-h-screen bg-background-light text-text-light antialiased ${inter.className} ${fontVars}`}>
        {children}
      </body>
    </html>
  );
}