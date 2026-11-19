import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const api = 'http://localhost:' + (process.env.STUDIO_PORT || 5174);
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true, proxy: { '/api': api, '/media': api, '/engine': api, '/fonts': api } },
});
