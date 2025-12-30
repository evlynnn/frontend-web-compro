/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",

  theme: {
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },

    extend: {
      maxWidth: {
        "6xl": "72rem", 
      },
    },
  },

  plugins: [
    function ({ addBase }) {
      addBase({
        "@media (max-width: 767px)": {
          ".ml-60": { marginLeft: "0 !important" },
          ".ml-64": { marginLeft: "0 !important" },
        },
      });
    },
  ],
};
