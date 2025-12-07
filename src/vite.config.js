import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@core': path.resolve(__dirname, './src/core'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, '../public/assets')
    }
  },
  server: {
    port: 5173,
    cors: true
  },
  build: {
    outDir: '../public',
    assetsDir: 'dist',
    emptyOutDir: false,  // Don't empty public/ (it has our assets)
    rollupOptions: {
      output: {
        entryFileNames: 'dist/js/[name].bundle.js',
        chunkFileNames: 'dist/js/[name].bundle.js',
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name.split('.').pop();
          if (ext === 'css') {
            return 'dist/css/[name].bundle.css';
          }
          return 'dist/[ext]/[name].[ext]';
        }
      }
    }
  }
})
