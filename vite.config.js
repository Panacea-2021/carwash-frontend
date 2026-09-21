import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
<<<<<<< HEAD
        target: "https://carwash-backend-k3pk.onrender.com",
=======
        target: "https://carwash-backend-qznz.onrender.com",
>>>>>>> 04c7292 (Update car wash frontend)
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
