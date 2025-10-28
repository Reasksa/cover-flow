import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/pages/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        background: {
          light: '#FFFFFF',
          dark: '#111827'
        },
        text: {
          light: '#1F2937',
          dark: '#F9FAFB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  darkMode: 'class',
  plugins: [require('@tailwindcss/typography')]
} satisfies Config;