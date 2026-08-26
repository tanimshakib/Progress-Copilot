/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        // Dark theme obsidian tokens
        obsidian: {
          bg: '#0B0F19',
          surface: '#111827',
          card: '#161F30',
          border: '#1F293D',
          textPrimary: '#F9FAFB',
          textSecondary: '#9CA3AF',
          textMuted: '#6B7280',
        },
        // Light theme slate tokens
        slateTheme: {
          bg: '#F8FAFC',
          surface: '#F1F5F9',
          card: '#FFFFFF',
          border: '#E2E8F0',
          textPrimary: '#0F172A',
          textSecondary: '#475569',
          textMuted: '#64748B',
        },
        // Legacy support
        darkBg: '#0B0F19',
        cardBg: '#161F30',
        cardBorder: '#1F293D',
        neonLime: '#ccff00',
      },
      boxShadow: {
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.45)',
        'glow-purple': '0 0 30px -5px rgba(168, 85, 247, 0.40)',
        'glow-pink': '0 0 25px -5px rgba(236, 72, 153, 0.35)',
        'glow-orange': '0 0 30px -5px rgba(249, 115, 22, 0.35)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.40)',
      },
      keyframes: {
        floatSlow: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        floatBadge: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: 0.42, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        },
      },
      animation: {
        float: 'floatSlow 5s ease-in-out infinite',
        floatSlow: 'floatBadge 4s ease-in-out infinite',
        glow: 'pulseGlow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};