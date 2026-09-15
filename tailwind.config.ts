import type { Config } from 'tailwindcss';

// Tokens extraidos do logotipo da loja.
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tinta:   { DEFAULT: '#141413', 900: '#0B0B0A', 800: '#1C1C1A', 700: '#2A2A27' },
        ouro:    { DEFAULT: '#FFD230', 600: '#E0B520', 700: '#A8850F', 100: '#FFF4CC' },
        neve:    { DEFAULT: '#FFFFFF', 200: '#E9ECEF', 400: '#B9BEC4', 600: '#6C737B' },
        ok:      '#2F8F5B',
        alerta:  '#C4553B',
      },
      fontFamily: {
        display: ['var(--fonte-display)', 'system-ui', 'sans-serif'],
        corpo:   ['var(--fonte-corpo)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '12px' },
    },
  },
  plugins: [],
} satisfies Config;
