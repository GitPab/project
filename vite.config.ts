import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv', '**/*.wasm'],

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries - optimized chunking
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui') || id.includes('cmdk')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts') || id.includes('react-day-picker')) {
              return 'vendor-charts';
            }
            if (id.includes('react-dnd') || id.includes('react-dropzone')) {
              return 'vendor-interactive';
            }
            if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('xlsx')) {
              return 'vendor-export';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // All other vendor libs go to vendor-other to avoid circular dependencies
            return 'vendor-other';
          }
          
          // Pages - split each route into separate chunk
          if (id.includes('pages/')) {
            const match = id.match(/pages\/(\w+)/);
            if (match) {
              return `page-${match[1].toLowerCase()}`;
            }
          }
          
          // Context - separate chunk
          if (id.includes('context/')) {
            return 'context';
          }
          
          // Components - split into smaller chunks
          if (id.includes('components/')) {
            if (id.includes('ui/')) {
              return 'components-ui';
            }
            return 'components';
          }
        },
      },
    },
    chunkSizeWarningLimit: 400, // Lower limit for better performance
    minify: 'terser',
    sourcemap: false, // Disable sourcemaps for production
    target: 'es2015', // Modern browser target
  },
  
  // Development server optimization
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  
  // Preview server optimization
  preview: {
    port: 4173,
    host: true,
  },
})
