import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync } from "node:fs";

const eventBannerImages = readdirSync(new URL("./public/images/event-banners/", import.meta.url))
  .filter(name => /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(name))
  .sort()
  .map(name => `/images/event-banners/${name}`);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { __EVENT_BANNER_IMAGES__: JSON.stringify(eventBannerImages) },
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
