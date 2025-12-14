import { API_BASE_URL } from '~/config/api'

// Lấy token từ local/session storage
export const getAuthToken = (): string | null =>
  localStorage.getItem('token') || sessionStorage.getItem('token')

// Thực hiện fetch với fallback baseURL
export const fetchWithFallback = async (url: string, init?: RequestInit) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
  return fetch(fullUrl, init)
}

// Trích xuất message thân thiện từ response
export const extractErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json()
    if (typeof data === 'string') return data
    if (data?.message) return data.message as string
    if (data?.error) return data.error as string
  } catch {
    // ignore
  }
  return fallback
}

export default {
  getAuthToken,
  fetchWithFallback,
  extractErrorMessage,
}



