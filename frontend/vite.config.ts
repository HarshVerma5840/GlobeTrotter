import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Port 5173 matches WEB_PORT in CONTRACTS.md §1 — don't change one
// without the other.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
