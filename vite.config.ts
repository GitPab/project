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
          // Vendor libraries - optimized chunking with smaller splits
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('@headlessui')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts') || id.includes('react-day-picker') || id.includes('chart')) {
              return 'vendor-charts';
            }
            if (id.includes('react-dnd') || id.includes('react-dropzone') || id.includes('@dnd-kit')) {
              return 'vendor-interactive';
            }
            if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('xlsx') || id.includes('file-saver')) {
              return 'vendor-export';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react-router') || id.includes('react-router-dom')) {
              return 'vendor-router';
            }
            if (id.includes('react') && !id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('zustand') || id.includes('jotai') || id.includes('valtio')) {
              return 'vendor-state';
            }
            // Split vendor-other by first letter to avoid huge chunks
            const firstLetter = id.charCodeAt(id.lastIndexOf('/') + 1) || 0;
            return `vendor-${String.fromCharCode(97 + (firstLetter % 4))}`;
          }
          
          // Admin pages - group related pages together
          if (id.includes('pages/Admin')) {
            if (id.includes('AdminDashboard') || id.includes('AdminAudit') || id.includes('AdminRegistrations')) {
              return 'admin-core';
            }
            if (id.includes('AdminEmail') || id.includes('AdminWorkflow') || id.includes('AdminSettings')) {
              return 'admin-config';
            }
            if (id.includes('AdminBulk') || id.includes('AdminScholarship') || id.includes('AdminVisa') || id.includes('AdminCalendar')) {
              return 'admin-operations';
            }
            if (id.includes('AdminFeedback') || id.includes('AdminRoles')) {
              return 'admin-management';
            }
            return 'admin-other';
          }
          
          // Student pages - group by feature
          if (id.includes('pages/Student') || id.includes('Student')) {
            return 'student-pages';
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
          
          // Services
          if (id.includes('services/')) {
            return 'services';
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
