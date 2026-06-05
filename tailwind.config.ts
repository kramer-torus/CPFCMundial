import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'palace-red': '#C4122E',
        'navy': '#1F3864',
        'gold': '#C9A84C',
      },
    },
  },
  plugins: [],
};

export default config;
