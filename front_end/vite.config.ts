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
      port: Number(env.VITE_APP_PORT)
    },
    resolve: {
      alias: [{ find: '~', replacement: '/src' }]
    },
    build: {
      outDir: 'dist'
    }
  }
})
