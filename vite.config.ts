import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 5000,
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
          if (id.includes('src/ui/')) {
            return 'ui';
          }
          if (
            id.includes('generatedNpcs') ||
            id.includes('npcData') ||
            id.includes('missionData') ||
            id.includes('overworld_items')
          ) {
            return 'world-data';
          }
          if (
            id.includes('cutsceneScripts') ||
            id.includes('npcInteractionHandler') ||
            id.includes('fallbackMaps')
          ) {
            return 'world-events';
          }
        },
      },
    },
  },
});
