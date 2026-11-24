import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Three.js core is 564 kB minified but only about 143 kB over gzip.
    // Keep the split vendor bundle while avoiding a misleading size warning.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/examples/')) return 'three-addons';
          if (id.includes('/node_modules/three/')) return 'three-core';
        }
      }
    }
  }
});
