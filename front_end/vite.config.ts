/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { loadEnvTyped } from './src/utils/env.utils'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig(({ mode }) => {
  const env = loadEnvTyped(mode)
  return {
    base: '/',
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL),
      __API_APP_PORT__: Number(env.VITE_APP_PORT),
      __KEY_STORAGE_ACCOUNT__: JSON.stringify(env.VITE_KEY_STORAGE_ACCOUNT),
      __BASE_PX_SIZE__: 10
    },
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.VITE_APP_PORT),
      strictPort: true // Bắt buộc dùng port 5173, báo lỗi nếu port đã bị chiếm
    },
    resolve: {
      alias: [{ find: '~', replacement: '/src' }]
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Tách Material-UI thành chunk riêng
            if (id.includes('@mui/material') || id.includes('@mui/icons-material') || id.includes('@emotion')) {
              return 'mui'
            }
            
            // Tách Firebase thành chunk riêng
            if (id.includes('firebase')) {
              return 'firebase'
            }
            
            // Tách Recharts thành chunk riêng
            if (id.includes('recharts')) {
              return 'recharts'
            }
            
            // Tách Chart.js thành chunk riêng (nếu có sử dụng)
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'chartjs'
            }
            
            // Tách SignalR thành chunk riêng
            if (id.includes('@microsoft/signalr') || id.includes('signalr')) {
              return 'signalr'
            }
            
            // Tách React Router thành chunk riêng
            if (id.includes('react-router-dom')) {
              return 'react-router'
            }
            
            // Tách các node_modules khác thành vendor chunk
            if (id.includes('node_modules')) {
              // Tách axios riêng vì được dùng nhiều
              if (id.includes('axios')) {
                return 'axios'
              }
              // Các thư viện khác vào vendor chunk
              return 'vendor'
            }
          }
        }
      },
      // Tối ưu chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Tối ưu minification
      minify: 'esbuild',
      // Source maps cho production (có thể tắt để giảm size)
      sourcemap: false
    }
  }
})
