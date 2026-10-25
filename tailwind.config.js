// Tokens from the AlkeShop canvas, Style C (dark and premium).
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        night: "#0B0B0F",
        surface: "#16171D",
        raised: "#22232A",
        line: "#2A2B33",
        "line-2": "#3A3B45",
        ink: "#F5F5F7",
        body: "#C9CBD2",
        mute: "#A0A3AD",
        dim: "#8A8D97",
        violet: { DEFAULT: "#A78BFA", text: "#C4B5FD", hover: "#DDD6FE", edge: "#3B2F5E" },
        peach: { DEFAULT: "#FFB38A", text: "#FFD2BA" },
        ok: "#4ADE80",
        bad: "#F87171",
      },
      borderRadius: { "4xl": "22px" },
    },
  },
  plugins: [],
};
