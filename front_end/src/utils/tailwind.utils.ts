import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeTailwindColor(value: string, alpha = 1): string {
  // Nếu là mã hex (#aabbcc)
  if (value.startsWith('#')) {
    // chuyển sang rgba
    const bigint = parseInt(value.slice(1), 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Nếu là oklch(...) thì thêm alpha vào
  if (value.startsWith('oklch(')) {
    return value.replace(')', ` / ${alpha})`)
  }

  // Nếu là rgb/hsl thì thêm alpha đúng cú pháp
  if (value.startsWith('rgb(') || value.startsWith('hsl(')) {
    return value.replace(')', ` / ${alpha})`)
  }

  // fallback
  return value
}
