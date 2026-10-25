import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on 127.0.0.1 as well as ::1, so both localhost forms work.
    host: true,
  },
  // Pre-bundle what's only imported lazily (the wallet dialogs, Nuru, Firebase),
  // so the dev server doesn't re-bundle mid-session and leave the page blank.
  optimizeDeps: {
    include: ["ethers", "qrcode.react", "firebase/app", "firebase/auth", "firebase/firestore"],
  },
  test: { environment: "node" },
});
