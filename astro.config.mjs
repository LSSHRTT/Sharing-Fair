import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

const isVercel = !!process.env.VERCEL;

export default defineConfig({
  security: { checkOrigin: false },
  output: 'server',
  adapter: isVercel
    ? vercel()
    : cloudflare({
        platformProxy: { enabled: true },
        imageService: 'passthrough',
      }),
  vite: {
    plugins: [tailwindcss()],
  },
});
