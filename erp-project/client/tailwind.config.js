/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#dce8ff',
          200: '#b2cffe',
          300: '#76adfb',
          400: '#3b82f6',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
        },
        gunmetal: {
          50: '#f2f4f5',
          100: '#dde3e6',
          200: '#b6c1c8',
          300: '#8a99a3',
          400: '#5e6f7a',
          500: '#3f4c56',
          600: '#2c3841',
          700: '#212b32',
          800: '#182027',
          900: '#10161b',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        safety: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        rivet: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        surface: '#f0f4f8',
        'surface-dark': '#0c1117',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 24px -4px rgba(59,130,246,0.35)',
        'glow-amber': '0 0 24px -4px rgba(251,191,36,0.35)',
        'glow-green': '0 0 24px -4px rgba(16,185,129,0.35)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.06)',
        'modal': '0 24px 64px rgba(0,0,0,0.18)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0c1117 0%, #161c24 50%, #1c2536 100%)',
        'gradient-amber': 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
        'mesh-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.3s ease both',
        'fade-in': 'fadeIn 0.25s ease both',
        'slide-in-right': 'slideInRight 0.3s ease both',
        'scale-in': 'scaleIn 0.2s ease both',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.6s ease infinite',
        'bounce-soft': 'bounceSoft 0.4s ease both',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-800px 0' },
          '100%': { backgroundPosition: '800px 0' },
        },
        bounceSoft: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.08)' },
          '70%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
