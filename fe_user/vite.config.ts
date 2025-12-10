/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { loadEnvTyped } from './src/utils/env.utils'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnvTyped(mode)
  return {
    base: './',
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL),
      __API_APP_PORT__: Number(env.VITE_APP_PORT),
      __KEY_STORAGE_ACCOUNT__: JSON.stringify(env.VITE_KEY_STORAGE_ACCOUNT),
      __BASE_PX_SIZE__: 10
    },
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.VITE_APP_PORT) || 3000
    },
    resolve: {
      alias: [{ find: '~', replacement: '/src' }]
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor chunks - separate large libraries
            if (id.includes('node_modules')) {
              // React core
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react'
              }
              // Material UI
              if (id.includes('@mui') || id.includes('@emotion')) {
                return 'vendor-mui'
              }
              // Charts
              if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
                return 'vendor-charts'
              }
              // Firebase
              if (id.includes('firebase')) {
                return 'vendor-firebase'
              }
              // Other vendor libraries
              return 'vendor-other'
            }
            // Feature chunks - group related components
            if (id.includes('/components/')) {
              // Payment related
              if (id.includes('Payment') || id.includes('UpgradePayment')) {
                return 'feature-payment'
              }
              // Host Dashboard - separate as it's large
              if (id.includes('HostDashboard')) {
                return 'feature-host-dashboard'
              }
              // Management pages - split further
              if (id.includes('BookingManager')) {
                return 'feature-booking-manager'
              }
              if (id.includes('CouponManager') || id.includes('CreateCoupon')) {
                return 'feature-coupon-manager'
              }
              if (id.includes('ReviewManager')) {
                return 'feature-review-manager'
              }
              if (id.includes('Revenue')) {
                return 'feature-revenue'
              }
              if (id.includes('ServiceComboManager') || id.includes('CreateServiceCombo') || id.includes('EditServiceCombo')) {
                return 'feature-service-combo-manager'
              }
              if (id.includes('ServiceManager') || id.includes('CreateService') || id.includes('EditService')) {
                return 'feature-service-manager'
              }
              // Services
              if (id.includes('ServicesPage') || id.includes('ServiceDetail') || id.includes('BookingPage')) {
                return 'feature-services'
              }
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
})






