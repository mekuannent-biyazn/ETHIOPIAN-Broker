/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#ff4747",
          dark: "#fb923c",
        },
        background: {
          light: "#f9fafb",
          dark: "#111827",
        },
        surface: {
          light: "#ffffff",
          dark: "#1f2937",
        },
        text: {
          light: "#111827",
          dark: "#f9fafb",
        },
      },
      backgroundImage: {
        "gradient-light":
          "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
        "gradient-dark":
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
      },
      transitionProperty: {
        colors: "background-color, border-color, color, fill, stroke",
      },
    },
  },
  plugins: [],
};
