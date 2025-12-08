import React from 'react'
import './Card.css'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const Card = ({ children, className = '', ...props }: CardProps) => {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export const CardContent = ({ children, className = '', ...props }: CardContentProps) => {
  return (
    <div className={`card-content ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}






















