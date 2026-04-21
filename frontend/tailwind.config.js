/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#FF7814', dark: '#A04400', light: '#FFF0E5' },
        secondary: { DEFAULT: '#0B8BC8', light: '#EAF0F8' },
        ds: {
          bg:           '#F2F3F5',
          card:         '#FFFFFF',
          border:       '#E5E7ED',
          borderStrong: '#D4D6DE',
          inputBorder:  '#B0B7C1',
          text:         '#171A45',
          textSecondary:'#323836',
          textTertiary: '#555698',
          textMuted:    '#8A8DA3',
          success:      '#177A17',
          successLight: '#E8F9E2',
          warning:      '#A26412',
          warningLight: '#FFF3E0',
          danger:       '#A01535',
          dangerLight:  '#FDE8E8',
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
