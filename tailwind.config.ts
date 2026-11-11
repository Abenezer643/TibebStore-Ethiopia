import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2e90fa, #9b51e0)',
      },
      borderRadius: {
        'card': 'var(--radius-card)',
        'button': 'var(--radius-button)',
        'input': 'var(--radius-input)',
        'badge': 'var(--radius-badge)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'shadow-md': 'var(--shadow-md)',
        'shadow-sm': 'var(--shadow-sm)',
        'hover': 'var(--shadow-hover)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      transitionDuration: {
        'fast': '150ms',
      },
    },
  },
  plugins: [],
};
export default config;
