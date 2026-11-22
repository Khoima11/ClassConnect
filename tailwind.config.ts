import type { Config } from 'tailwindcss';

// Tema ClassConnect: biru navy + kuning mustard + krem
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#EEF2F8', 100: '#D6E0EE', 200: '#AFC1DC', 300: '#8BA3C7', 600: '#2E5089', 700: '#24406B', 800: '#1C3357', 900: '#142640' },
        emas: { 50: '#FCF6EC', 100: '#F6EBDA', 200: '#EFD9B0', 300: '#E8C584', 400: '#E4B666', 500: '#E0A84A', 600: '#C98F2E', 700: '#A2721F' },
        hijau: { 50: '#ecfdf3', 100: '#d1fadf', 600: '#16a34a', 700: '#15803d' },
        latar: '#F5F2EC',
      },
      borderRadius: { '2xl': '1.1rem' },
    },
  },
  plugins: [],
};
export default config;
