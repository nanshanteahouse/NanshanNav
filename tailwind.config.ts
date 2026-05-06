/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        card: 'var(--color-card)',
        'card-border': 'var(--color-card-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        accent: 'var(--color-accent)',
        'search-bg': 'var(--color-search-bg)',
        'search-border': 'var(--color-search-border)',
        'category-title': 'var(--color-category-title)',
        'status-online': 'var(--color-status-online)',
        'status-offline': 'var(--color-status-offline)',
      },
      gridTemplateColumns: {
        'card-grid': 'repeat(auto-fill, minmax(200px, 1fr))',
      },
      minWidth: {
        'card': '200px',
      },
    },
  },
  plugins: [],
}
