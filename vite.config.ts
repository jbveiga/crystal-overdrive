import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: false,
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 5000, // accommodates full Gen 2 @pkmn/dex learnset definitions (Ticket 6.5)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@pkmn/dex')) {
              return 'dex';
            }
            if (id.includes('pixi.js')) {
              return 'pixi';
            }
            if (id.includes('howler')) {
              return 'audio';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
