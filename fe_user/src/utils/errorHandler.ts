// Centralized Error Handling
export const logError = (error: unknown, context = '') => {
  // Only log in development
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error)
  }

  // In production, send to error tracking service
  // Example: Sentry.captureException(error, { tags: { context } })
}

export const handleApiError = (error: unknown) => {
  logError(error, 'API')

  // Return user-friendly error message
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number } }
    // Server responded with error
    return `Lỗi từ server: ${axiosError.response?.status || 'Unknown'}`
  } else if (error && typeof error === 'object' && 'request' in error) {
    // Request made but no response
    return 'Không thể kết nối đến server. Vui lòng thử lại sau.'
  } else {
    // Something else happened
    return 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
  }
}






