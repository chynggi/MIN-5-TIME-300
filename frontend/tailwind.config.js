/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        secondary: "#64748B",
        background: "#F8FAFC",
        accent: "#EAB308",
      },
    },
  },
  plugins: [],
};
