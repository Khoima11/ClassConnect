import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#eef3f9', 100: '#d5e1ef', 600: '#25507f', 700: '#1e3a5f', 800: '#172d4a', 900: '#0f1f33' },
        hijau: { 50: '#ecfdf3', 100: '#d1fadf', 600: '#16a34a', 700: '#15803d' },
      },
    },
  },
  plugins: [],
};
export default config;
