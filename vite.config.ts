import { defineConfig } from 'vite';

export default defineConfig({
  test: { setupFiles: ['./tests/setup/browserGlobals.ts'] },
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  preview: {
    allowedHosts: true,
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // learnsets (~3MB) are dynamically imported by @pkmn/dex; keep them in their own lazy chunk
            if (id.includes('@pkmn/dex') && !id.includes('learnsets')) {
              return 'dex';
            }
            if (id.includes('pixi.js')) {
              return 'pixi';
            }
            if (id.includes('howler')) {
              return 'audio';
            }
            if (id.includes('learnsets')) {
              return undefined;
            }
            return 'vendor';
          }
          // interactions and ui import each other, so they share one chunk (avoids a circular chunk)
          if (id.includes('src/ui/') || id.includes('src/world/interactions/')) {
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
