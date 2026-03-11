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
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries
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
          // Components - separate chunk
          if (id.includes('components/')) {
            return 'components';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
