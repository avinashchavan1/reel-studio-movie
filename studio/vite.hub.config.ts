import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Publish Hub: a static, phone-first site with every episode ready to post. Deployed to Netlify.
export default defineConfig({
  root: 'hub', base: '/', publicDir: 'public',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../hub-dist', emptyOutDir: true },
});
