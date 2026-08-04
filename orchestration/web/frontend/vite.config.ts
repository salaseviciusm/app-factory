import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only proxy so `npm run dev` talks to a locally running server.mjs.
// Production serving is done by server.mjs itself from dist/.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:4620",
    },
  },
});
