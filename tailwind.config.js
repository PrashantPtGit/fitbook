/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#534AB7',
          light: '#EEEDFE',
          mid: '#AFA9EC',
          dark: '#3C3489',
          darker: '#26215C'
        },
        success: { DEFAULT: '#1D9E75', light: '#E1F5EE', dark: '#085041' },
        warning: { DEFAULT: '#BA7517', light: '#FAEEDA', dark: '#633806' },
        danger:  { DEFAULT: '#A32D2D', light: '#FCEBEB', dark: '#791F1F' },
        neutral: { 50: '#F1EFE8', 100: '#D3D1C7', 400: '#888780', 600: '#5F5E5A', 900: '#2C2C2A' },
        gym1: { DEFAULT: '#534AB7', light: '#EEEDFE', dark: '#3C3489' },
        gym2: { DEFAULT: '#1D9E75', light: '#E1F5EE', dark: '#085041' },
        gym3: { DEFAULT: '#BA7517', light: '#FAEEDA', dark: '#633806' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '12px', btn: '8px' },
    },
  },
  plugins: [],
}
