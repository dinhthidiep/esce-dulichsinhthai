import React from 'react'
import './Badge.css'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  className?: string
}

const Badge = ({ children, variant = 'default', className = '', ...props }: BadgeProps) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  )
}

export default Badge





















