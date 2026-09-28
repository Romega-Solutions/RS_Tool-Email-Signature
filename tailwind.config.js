/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        'seasons': ['The Seasons', 'serif'],
        'poppins': ['Poppins', 'sans-serif'],
        // Alias kept so the many existing `font-source-sans` usages across
        // ControlsForm/Welcome/DownloadButtons keep working. Rename is a
        // separate cleanup commit.
        'source-sans': ['Poppins', 'sans-serif'],
      },
      fontWeight: {
        'thin': '100',
        'extralight': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      colors: {
        'rs-primary': {
          50: 'hsla(207, 77%, 95%, 1)',
          100: 'hsla(209, 84%, 88%, 1)',
          200: 'hsla(209, 89%, 78%, 1)',
          300: 'hsla(209, 96%, 65%, 1)',
          400: 'hsla(209, 100%, 55%, 1)',
          500: 'hsla(209, 100%, 45%, 1)',
          600: 'hsla(209, 80%, 35%, 1)',
          700: 'hsla(209, 100%, 28%, 1)',
          800: 'hsla(209, 100%, 23%, 1)',
          900: 'hsla(209, 90%, 18%, 1)',
          950: 'hsla(209, 70%, 12%, 1)',
        },
        'rs-accent': {
          50: 'hsla(42, 77%, 95%, 1)',
          100: 'hsla(42, 100%, 88%, 1)',
          200: 'hsla(42, 95%, 76%, 1)',
          300: 'hsla(42, 95%, 62%, 1)',
          400: 'hsla(42, 95%, 52%, 1)',
          500: 'hsla(42, 94%, 45%, 1)',
          600: 'hsla(42, 94%, 43%, 1)',
          700: 'hsla(42, 94%, 38%, 1)',
          800: 'hsla(42, 86%, 30%, 1)',
          900: 'hsla(43, 76%, 18%, 1)',
          950: 'hsla(42, 60%, 10%, 1)',
        },
        'rs-neutral': {
          50: 'hsla(208, 87%, 97%, 1)',
          100: 'hsla(209, 69%, 90%, 1)',
          200: 'hsla(209, 60%, 80%, 1)',
          300: 'hsla(209, 50%, 70%, 1)',
          400: 'hsla(209, 40%, 60%, 1)',
          500: 'hsla(209, 35%, 50%, 1)',
          600: 'hsla(209, 40%, 35%, 1)',
          700: 'hsla(209, 50%, 25%, 1)',
          800: 'hsla(208, 60%, 18%, 1)',
          900: 'hsla(209, 67%, 13%, 1)',
          950: 'hsla(208, 74%, 9%, 1)',
        },
      },
    },
  },
  plugins: [],
}