import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths let the same build run at a domain root or a
  // repository-scoped GitHub Pages URL.
  base: "./",
  plugins: [react()],
  build: {
    // Three.js is isolated behind the on-demand 3D-model import; its 141 kB gzip
    // chunk is intentionally larger than Vite's generic uncompressed threshold.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
