import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    // Le projet sert ses images telles quelles (<img> natif) :
    // évite d'embarquer sharp (devDep des icônes PWA) dans le worker.
    imageService: 'passthrough',
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
