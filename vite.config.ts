import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configure base for GitHub Pages:
// - For project pages (https://USER.github.io/REPO), set base to '/REPO/'.
// - For user/organization pages (https://USER.github.io), set base to '/'.
// You can set REPO name via env VITE_GH_PAGES_BASE, or hardcode below.
const repo = process.env.VITE_GH_PAGES_BASE || ''; // e.g. 'your-repo-name'
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
