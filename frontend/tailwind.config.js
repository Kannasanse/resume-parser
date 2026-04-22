/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#FF7814', dark: '#A04400', light: '#FFF0E5' },
        secondary: { DEFAULT: '#0B8BC8', light: '#EAF0F8' },
        ds: {
          bg:           'var(--ds-bg)',
          card:         'var(--ds-card)',
          border:       'var(--ds-border)',
          borderStrong: 'var(--ds-borderStrong)',
          inputBorder:  'var(--ds-inputBorder)',
          text:         'var(--ds-text)',
          textSecondary:'var(--ds-textSecondary)',
          textTertiary: 'var(--ds-textTertiary)',
          textMuted:    'var(--ds-textMuted)',
          success:      'var(--ds-success)',
          successLight: 'var(--ds-successLight)',
          warning:      'var(--ds-warning)',
          warningLight: 'var(--ds-warningLight)',
          danger:       'var(--ds-danger)',
          dangerLight:  'var(--ds-dangerLight)',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body:    ['Source Sans 3', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        btn:     '999px',
      },
    },
  },
  plugins: [],
};
