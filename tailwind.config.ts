import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f0f0f',
          card: '#1a1a1a',
          input: '#242424',
          hover: '#2a2a2a',
        },
        accent: {
          purple: '#7c3aed',
          pink: '#ec4899',
        },
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #7c3aed, #ec4899)',
        'gradient-subtle': 'linear-gradient(135deg, #7c3aed22, #ec489922)',
      },
      animation: {
        'pulse-dot': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
export default config
