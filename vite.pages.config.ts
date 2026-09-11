import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function githubPagesBase() {
  const repository = process.env.GITHUB_REPOSITORY?.split('/').at(-1);

  if (!repository || repository.toLowerCase().endsWith('.github.io'))
    return '/';
  return `/${repository}/`;
}

export default defineConfig({
  root: 'github-pages',
  publicDir: '../public',
  base: githubPagesBase(),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  define: {
    'import.meta.env.VITE_GITHUB_PAGES': JSON.stringify('true'),
    'import.meta.env.VITE_APP_MODE': JSON.stringify('demo'),
  },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
