import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      // 압축 알고리즘 지정, 기본적으로는 'gzip'을 사용
      algorithm: "gzip",
      // 압축된 파일의 확장자를 '.gz'로 설정
      ext: ".gz",
    }),
  ],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "zustand", "@tanstack/react-query"],
          reactRouter: ["react-router-dom"],
          animations: ["framer-motion", "gsap", "aos"],
          swiperBundle: ["swiper"],
        },
      },
    },
  },
});
