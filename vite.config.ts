import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve('C:/Users/gksdn/Desktop/TeamODD_Project/teamodd.github.io'),
    emptyOutDir: true,
  },
})
