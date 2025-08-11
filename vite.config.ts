import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configure base for GitHub Pages:
// - For project pages (https://USER.github.io/REPO), set base to '/REPO/'.
// - For user/organization pages (https://USER.github.io), set base to '/'.
const repo = process.env.VITE_GH_PAGES_BASE || process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
const base = repo ? `/${repo}/` : '/';

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: true,
  },
  preview: {
    port: 4173,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
