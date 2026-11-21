import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

// "kurgu." design tokens: warm editorial neutrals, aubergine navigation and a coral accent.
const aubergine = {
  base: '#1C1520',
  raised: '#241C29',
  active: '#2A2230',
} as const

const coral = {
  base: '#E8664A',
  hover: '#D9573C',
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
        // Warm neutral scale; every grey in the app comes from here.
        ink: {
          50: '#FAF7F2',
          100: '#F1ECE4',
          200: '#EAE4DA', // card borders
          300: '#D9D1C5',
          400: '#A79E92', // icons, placeholders (decorative)
          500: '#6E665D', // secondary text: 5.0:1 on canvas, 5.5:1 on cards (WCAG AA)
          600: '#575048',
          700: '#423C35',
          800: '#2B2620',
          900: '#1C1520', // primary text
          950: '#120D15',
        },
        canvas: '#F5F1EA',
        surface: '#FFFDF9',
        sidebar: {
          DEFAULT: aubergine.base,
          hover: aubergine.raised,
          active: aubergine.active,
          text: '#B9AEC0',
          muted: '#8C8194',
        },
        // Primary actions: coral with aubergine text (white on coral is only 3.3:1)
        primary: {
          DEFAULT: coral.base,
          hover: coral.hover,
          ink: aubergine.base,
        },
        // Accent for small brand moments (active nav marker, focus ring, links)
        brand: {
          DEFAULT: coral.base,
          soft: '#FDEDE8',
          ink: '#A8402A', // coral text on light surfaces (6.0:1)
        },
        // Status colours, used identically for badges, chart segments and row stripes.
        // DEFAULT: graphics (>= 3:1 on cards) · soft: badge background · ink: badge text (>= 6.7:1)
        status: {
          draft: { DEFAULT: '#8F877E', soft: '#EFEAE3', ink: '#4E4842' },
          review: { DEFAULT: '#B8862F', soft: '#F6EBD2', ink: '#6B4A0E' },
          published: { DEFAULT: '#4A8A68', soft: '#E0EEE5', ink: '#24563D' },
        },
      },
      fontFamily: {
        sans: ['"DM Sans Variable"', ...defaultTheme.fontFamily.sans],
        // Extended display face: page titles (H1) and KPI numbers only
        display: ['Unbounded', '"DM Sans Variable"', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        card: 'none',
        lift: '0 12px 28px -18px rgb(28 21 32 / 0.35)',
        overlay: '0 24px 48px -16px rgb(28 21 32 / 0.28)',
        // Light elevation for dropdown lists
        popover: '0 12px 32px -14px rgb(28 21 32 / 0.25), 0 2px 6px -2px rgb(28 21 32 / 0.08)',
      },
      borderRadius: {
        card: '20px',
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
