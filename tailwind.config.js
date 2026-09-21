/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dynamic Variable Mapping
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          light: "var(--color-primary-light)",
          text: "var(--color-primary-text)",
        },
        page: "var(--color-page)",
        card: "var(--color-card)",
        border: "var(--color-border)",

        // Text
        text: {
          main: "var(--color-text-main)",
          sub: "var(--color-text-sub)",
          muted: "var(--color-text-muted)",
          inverse: "var(--color-text-inverse)",
        },

        // Inputs
        input: {
          bg: "var(--color-input-bg)",
          border: "var(--color-input-border)",
          focus: "var(--color-input-focus)",
        },

        // Gradients
        grad: {
          start: "var(--color-grad-start)",
          mid: "var(--color-grad-mid)",
          end: "var(--color-grad-end)",
        },
        blob: "var(--color-blob)",

        // Status
        danger: {
          DEFAULT: "var(--color-danger)",
          bg: "var(--color-danger-bg)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          bg: "var(--color-success-bg)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      spacing: {
        "sidebar-w": "280px",
        "header-h": "74px",
      },
      borderRadius: {
        DEFAULT: "0.625rem", // 10px
        card: "1rem", // 16px
      },
      boxShadow: {
        card: "0 4px 6px -1px var(--shadow-color), 0 2px 4px -1px var(--shadow-color)",
      },
    },
  },
  plugins: [],
};
