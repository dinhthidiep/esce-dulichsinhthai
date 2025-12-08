import { createRoot } from 'react-dom/client'
import React from 'react'
import '~/styles/index.css'
import App from '~/App.tsx'
import { ThemeContextProvider } from '~/contexts/theme'

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ [ErrorBoundary] Lỗi trong ứng dụng:', error)
    console.error('❌ [ErrorBoundary] Error Info:', errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Đã xảy ra lỗi</h1>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            {this.state.error?.message || 'Lỗi không xác định'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Tải lại trang
          </button>
          <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '800px', margin: '2rem auto' }}>
            <summary style={{ cursor: 'pointer', color: '#64748b' }}>Chi tiết lỗi</summary>
            <pre style={{ 
              background: '#f1f5f9', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

// Log để debug
if (import.meta.env.DEV) {
  console.log('✅ [main.tsx] File đang được load')
  console.log('✅ [main.tsx] React version:', React.version)
}

// Kiểm tra root element
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ [main.tsx] Không tìm thấy element #root')
  throw new Error('Không tìm thấy element #root trong HTML')
}

if (import.meta.env.DEV) {
  console.log('✅ [main.tsx] Root element found:', rootElement)
}

try {
  if (import.meta.env.DEV) {
    console.log('✅ [main.tsx] Đang tạo root và render...')
  }
  
  const root = createRoot(rootElement)
  
  if (import.meta.env.DEV) {
    console.log('✅ [main.tsx] Root created, rendering app...')
  }
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeContextProvider>
          <App />
        </ThemeContextProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
  
  if (import.meta.env.DEV) {
    console.log('✅ [main.tsx] App đã được render thành công!')
  }
} catch (error) {
  console.error('❌ [main.tsx] Lỗi khi render ứng dụng:', error)
  if (error instanceof Error) {
    console.error('❌ [main.tsx] Error stack:', error.stack)
  }
  document.body.innerHTML = `
    <div style="padding: 2rem; text-align: center; font-family: system-ui, sans-serif;">
      <h1 style="color: #dc2626;">⚠️ Lỗi khởi động ứng dụng</h1>
      <p style="color: #64748b;">${error instanceof Error ? error.message : 'Lỗi không xác định'}</p>
      <p style="color: #64748b; margin-top: 1rem;">Vui lòng mở Console (F12) để xem chi tiết lỗi.</p>
    </div>
  `
}

