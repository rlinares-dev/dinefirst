import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0a0a0a',
          soft: '#141414',
          elevated: '#1a1a1a',
        },
        foreground: {
          DEFAULT: '#F9FAFB',
          muted: '#d4d4d4',
          subtle: '#8a8a8a',
        },
        accent: {
          DEFAULT: '#F97316',
          soft: '#FDBA74',
          strong: '#EA580C',
        },
        success: {
          DEFAULT: '#22C55E',
          soft: '#4ADE80',
        },
        danger: {
          DEFAULT: '#EF4444',
          soft: '#FCA5A5',
        },
        border: {
          subtle: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.14)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,0.3)',
        card: '0 4px 16px rgba(0,0,0,0.25)',
        'card-hover': '0 8px 25px rgba(0,0,0,0.4)',
        deep: '0 20px 60px rgba(0,0,0,0.5)',
        'glow-sm': '0 0 16px rgba(249,115,22,0.2)',
        'glow-md': '0 0 28px rgba(249,115,22,0.3)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.15) 0%, transparent 70%)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'slide-down': 'slideDown 0.3s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config
