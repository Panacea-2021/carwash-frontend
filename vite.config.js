import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  server: {
    proxy: {
      "/api": {
        target: "https://carwash-backend-k3pk.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
