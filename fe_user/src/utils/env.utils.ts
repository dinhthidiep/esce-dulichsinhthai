/// <reference types="vite/client" />
import { loadEnv } from 'vite'

export function loadEnvTyped(mode: string): ImportMetaEnv {
  const env = loadEnv(mode, process.cwd(), '')
  return env as unknown as ImportMetaEnv
}






















