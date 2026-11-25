import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy sends /api calls to your Node backend (port 5000) once you build it.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
});
