import { Inter, Poppins, Montserrat, Nunito } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-montserrat',
});

export const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
});

export function fontClass(selected?: string | null) {
  switch ((selected || '').toLowerCase()) {
    case 'poppins':
      return poppins.className;
    case 'montserrat':
      return montserrat.className;
    case 'nunito':
      return nunito.className;
    case 'inter':
    default:
      return inter.className;
  }
}