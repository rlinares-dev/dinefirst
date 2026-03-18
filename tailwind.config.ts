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
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(249,115,22,0.15)' },
          '50%': { boxShadow: '0 0 24px rgba(249,115,22,0.35)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'blur-in': {
          '0%': { opacity: '0', filter: 'blur(8px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'slide-down': 'slideDown 0.3s ease forwards',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'blur-in': 'blur-in 0.5s ease forwards',
        'slide-in-right': 'slide-in-right 0.4s ease forwards',
        'slide-in-left': 'slide-in-left 0.4s ease forwards',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
