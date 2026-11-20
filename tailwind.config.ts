import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

// Single source for the anthracite brand surface shared by the sidebar and primary buttons.
const anthracite = {
  base: '#242424',
  raised: '#2E2E2E',
  strong: '#383838',
} as const

export default {
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.ts',
    './utils/**/*.ts',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        // "Kilit Signature" palette. All neutrals come from this single scale.
        ink: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E5E7EB', // borders
          300: '#D4D4D8',
          400: '#A3A3A3',
          // Secondary text. #737373 (brief) is 4.36:1 on #F5F5F3; #6B6B6B keeps WCAG AA (>= 4.5:1) on all surfaces.
          500: '#6B6B6B',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717', // primary text
          950: '#0A0A0A',
        },
        // Main application background (very light warm grey)
        canvas: '#F5F5F3',
        // Navigation surface (dark anthracite)
        sidebar: {
          DEFAULT: anthracite.base,
          hover: anthracite.raised,
          active: anthracite.strong,
        },
        // Primary actions use the exact sidebar colour
        primary: {
          DEFAULT: anthracite.base,
          hover: anthracite.strong,
        },
        // Kilit Grup corporate red: small accents only (active nav, selection, focus)
        brand: {
          DEFAULT: '#EA0029',
          soft: '#FFF1F2',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(23 23 23 / 0.04)',
        overlay: '0 16px 40px -12px rgb(23 23 23 / 0.18)',
        // Light elevation for dropdown lists
        popover: '0 10px 28px -12px rgb(23 23 23 / 0.16), 0 2px 6px -2px rgb(23 23 23 / 0.06)',
      },
      keyframes: {
        'dialog-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'dialog-in': 'dialog-in 180ms ease-out',
        'toast-in': 'toast-in 200ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
