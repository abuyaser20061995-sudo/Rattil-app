export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        arabic: ['"Noto Naskh Arabic"', '"Amiri"', 'serif'],
        ui: ['"IBM Plex Sans Arabic"', 'sans-serif']
      },
      colors: {
        primary: {
          50: '#E8F3EC',
          100: '#C6E1CE',
          300: '#5F9C74',
          500: '#1F7A4D',
          700: '#0F5132',
          900: '#0A3A24'
        },
        surface: {
          light: '#FBFAF7',
          lightAlt: '#F2F0EA',
          dark: '#121712',
          darkAlt: '#1A211B'
        },
        ink: {
          light: '#1C2620',
          dark: '#E7EDE8'
        }
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
}
