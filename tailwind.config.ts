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
        // Dark base - deep, professional blacks
        'dark': {
          950: '#050508',
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a24',
          600: '#23232e',
          500: '#2c2c38',
          400: '#3a3a48',
        },
        // Iron steel - industrial, strong
        'iron': {
          600: '#4a5568',
          500: '#5a6b7f',
          400: '#6b7c92',
          300: '#8896a8',
        },
        // Electric blue - high-tech, sharp, focused
        'electric': {
          600: '#0084ff',
          500: '#00a3ff',
          400: '#33b5ff',
          300: '#66c7ff',
          200: '#99d9ff',
        },
        // Champion gold - PRs, achievements, elite
        'champion': {
          600: '#f59e0b',
          500: '#fbbf24',
          400: '#fcd34d',
          300: '#fde68a',
        },
        primary: '#00a3ff', // Electric blue
        accent: '#fbbf24',  // Champion gold
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(135deg, #050508 0%, #1a1a24 100%)',
        'gradient-power': 'linear-gradient(135deg, #00a3ff 0%, #fbbf24 100%)',
        'gradient-electric': 'linear-gradient(135deg, #00a3ff 0%, #0084ff 100%)',
        'gradient-champion': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        'gradient-iron': 'linear-gradient(135deg, #4a5568 0%, #6b7c92 100%)',
        // Mesh gradient for hero sections - blue and gold
        'mesh-dark': `
          radial-gradient(at 40% 20%, rgba(0, 163, 255, 0.12) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(251, 191, 36, 0.08) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(74, 85, 104, 0.08) 0px, transparent 50%),
          linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%)
        `,
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 163, 255, 0.6)',
        'neon-lg': '0 0 40px rgba(0, 163, 255, 0.4)',
        'champion': '0 0 20px rgba(251, 191, 36, 0.6)',
        'champion-lg': '0 0 40px rgba(251, 191, 36, 0.4)',
        'iron': '0 0 20px rgba(74, 85, 104, 0.4)',
        'glow-electric': '0 0 30px rgba(0, 163, 255, 0.3), inset 0 0 30px rgba(0, 163, 255, 0.1)',
        'glow-champion': '0 0 30px rgba(251, 191, 36, 0.3), inset 0 0 30px rgba(251, 191, 36, 0.1)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-champion': 'glowChampion 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 163, 255, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 163, 255, 0.8), 0 0 40px rgba(0, 163, 255, 0.4)' },
        },
        glowChampion: {
          '0%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
