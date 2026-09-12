import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Why `base: './'`:
// When Electron loads the built app it uses a file:// URL, not http://.
// Absolute paths like "/assets/index.js" would resolve to the root of your
// filesystem and 404. Relative paths resolve next to index.html, which is what
// we want. This single line is the #1 cause of "white screen in production".
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Babel-standalone is ~3MB and is the whole point of the React preview,
    // so the default 500kB warning is just noise here.
    chunkSizeWarningLimit: 5000,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
