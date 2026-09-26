/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        forge: {
          50: '#EFFBF9', 100: '#D6F5F0', 200: '#ADEAE2', 300: '#78D8CE',
          400: '#43BEB3', 500: '#1FA096', 600: '#12817A', 700: '#106762',
          800: '#11534F', 900: '#114542', 950: '#052A28',
        },
        ember: {
          50: '#FFF4ED', 100: '#FFE6D5', 200: '#FFC9AA', 300: '#FFA474',
          400: '#FF7A3D', 500: '#FF5A17', 600: '#F03E0B', 700: '#C72D0C',
          800: '#9E2612', 900: '#7F2312', 950: '#450F06',
        },
        ink: {
          50: '#F6F7F9', 100: '#ECEEF2', 200: '#D5DAE3', 300: '#B0B9C9',
          400: '#8592A9', 500: '#65738D', 600: '#505C74', 700: '#414B5E',
          800: '#39414F', 900: '#1B2435', 950: '#0D1420',
        },
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(13 20 32 / 0.05)',
        sm: '0 1px 3px 0 rgb(13 20 32 / 0.07), 0 1px 2px -1px rgb(13 20 32 / 0.06)',
        card: '0 1px 2px 0 rgb(13 20 32 / 0.04), 0 4px 12px -4px rgb(13 20 32 / 0.08)',
        pop: '0 12px 32px -8px rgb(13 20 32 / 0.18), 0 2px 6px -2px rgb(13 20 32 / 0.08)',
        overlay: '0 24px 60px -12px rgb(13 20 32 / 0.35)',
      },
      borderRadius: { md: '0.375rem', lg: '0.5rem', xl: '0.75rem' },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in .18s ease-out',
        'slide-up': 'slide-up .22s cubic-bezier(.2,.8,.2,1)',
        'slide-in-right': 'slide-in-right .28s cubic-bezier(.2,.8,.2,1)',
        'slide-in-left': 'slide-in-left .28s cubic-bezier(.2,.8,.2,1)',
        'scale-in': 'scale-in .16s ease-out',
        'toast-in': 'toast-in .24s cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
}
