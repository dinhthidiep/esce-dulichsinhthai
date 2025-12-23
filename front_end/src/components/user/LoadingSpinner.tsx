import React from 'react'
import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  message?: string
}

const LoadingSpinner = ({ message = 'Đang tải...' }: LoadingSpinnerProps) => {
  return (
    <div className="loading-spinner-container" role="status" aria-live="polite">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  )
}

export default LoadingSpinner



























