/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#185FA5', dark: '#0C447C', light: '#E6F1FB' },
        secondary: { DEFAULT: '#1D9E75', light: '#E6F5F0' },
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
