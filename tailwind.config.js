/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand: Power Purple ───────────────────────────────────────────────
        primary: {
          DEFAULT: '#534AB7',
          light:   '#EEEDFE',
          mid:     '#AFA9EC',
          dark:    '#3C3489',
          darker:  '#26215C',
        },
        // ── Semantic ──────────────────────────────────────────────────────────
        success: { DEFAULT: '#1D9E75', light: '#E1F5EE', dark: '#085041' },
        warning: { DEFAULT: '#BA7517', light: '#FAEEDA', dark: '#633806' },
        danger:  { DEFAULT: '#A32D2D', light: '#FCEBEB', dark: '#791F1F' },
        info:    { DEFAULT: '#378ADD', light: '#EAF3FD', dark: '#1A5499' },
        // ── Ink (text) ────────────────────────────────────────────────────────
        ink: {
          DEFAULT:   '#1A1A2E',   // Text-1 — primary text
          secondary: '#6B6B8A',   // Text-2 — labels, secondary
          muted:     '#A8A8C0',   // Text-3 — placeholders, hints
        },
        // ── Surface ───────────────────────────────────────────────────────────
        surface: {
          DEFAULT: '#FFFFFF',
          app:     '#F8F7FF',     // App background (purple tint)
          border:  '#EBEBF5',     // Card borders, dividers
        },
        // ── Gym accent colors ─────────────────────────────────────────────────
        gym1: { DEFAULT: '#534AB7', light: '#EEEDFE', dark: '#3C3489' },
        gym2: { DEFAULT: '#1D9E75', light: '#E1F5EE', dark: '#085041' },
        gym3: { DEFAULT: '#BA7517', light: '#FAEEDA', dark: '#633806' },
        // ── Energy accents ─────────────────────────────────────────────────
        neon:     '#7B6FF0',
        electric: '#4ECDC4',
        fire:     '#FF6B35',
        // ── Legacy neutrals (keep for backward compat) ───────────────────────
        neutral: { 50: '#F1EFE8', 100: '#D3D1C7', 400: '#888780', 600: '#5F5E5A', 900: '#2C2C2A' },
      },

      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },

      fontSize: {
        'display': ['32px', { lineHeight: '1.1',  fontWeight: '800' }],
        'h1':      ['24px', { lineHeight: '1.25', fontWeight: '700' }],
        'h2':      ['18px', { lineHeight: '1.3',  fontWeight: '600' }],
        'h3':      ['15px', { lineHeight: '1.4',  fontWeight: '600' }],
      },

      borderRadius: {
        sm:   '6px',
        DEFAULT: '8px',
        btn:  '8px',
        card: '14px',
        xl:   '20px',
        full: '9999px',
      },

      boxShadow: {
        card:        '0 1px 3px rgba(83,74,183,0.08)',
        float:       '0 4px 16px rgba(83,74,183,0.12)',
        overlay:     '0 8px 32px rgba(83,74,183,0.18)',
        hero:        '0 20px 60px rgba(83,74,183,0.25)',
        focus:       '0 0 0 3px rgba(83,74,183,0.12)',
        'inset-l':   'inset 3px 0 0 #534AB7',
        'inset-l-sm':'inset 2px 0 0 #534AB7',
      },

      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'badge-pulse': {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(0.85)' },
        },
        'slide-in-top': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer:        'shimmer 1.6s linear infinite',
        'badge-pulse':  'badge-pulse 1.5s ease infinite',
        'slide-in-top': 'slide-in-top 0.2s ease-out',
        'fade-in':      'fade-in 0.15s ease-out',
        'count-up':     'count-up 0.4s ease-out',
      },

      transitionDuration: {
        150: '150ms',
        200: '200ms',
      },
    },
  },
  plugins: [],
}
