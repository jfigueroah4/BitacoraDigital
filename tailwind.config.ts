import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        sans: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#5E0006',
          DEFAULT: '#9B0F06',
          orange: '#D53E0F',
          cream: '#EED9B9',
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out forwards',
        slideUp: 'slideUp 0.2s ease-out',
        'pulse-gradient': 'radiusGradientPulse 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        radiusGradientPulse: {
          '0%': { opacity: '0.2' },
          '50%': { opacity: '0.4' },
          '100%': { opacity: '0.2' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
