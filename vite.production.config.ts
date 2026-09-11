import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'github-pages',
  publicDir: '../public',
  base: '/',
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  define: {
    'import.meta.env.VITE_GITHUB_PAGES': JSON.stringify('false'),
    'import.meta.env.VITE_APP_MODE': JSON.stringify('production'),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api/v1'),
  },
  plugins: [react(), tailwindcss()],
  build: { outDir: '../dist-production', emptyOutDir: true },
});
