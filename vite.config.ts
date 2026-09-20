import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createApiMiddleware } from './server/routes';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'classroom-ta-server-middleware',
      configureServer(server) {
        server.middlewares.use(createApiMiddleware(__dirname));
      }
    }
  ],
  server: {
    port: 3000,
    host: true
  }
});
