/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        night: "#070914",
        panel: "#0D1222",
        line: "rgba(255,255,255,0.1)",
        cyan: "#5CE1E6",
        lime: "#B9F28C",
        coral: "#FF7A6B"
      },
      boxShadow: {
        glow: "0 0 50px rgba(92, 225, 230, 0.16)"
      }
    }
  },
  plugins: []
};
