import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // Backend server URL for API
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),  // Optional: remove '/api' prefix
      },
      '/socket.io': {
        target: 'http://localhost:3000',  // Backend server URL for Socket.IO
        ws: true,  // Enable WebSocket proxying
        changeOrigin: true,  // Needed for virtual hosted sites
      },
    },
  },
});
