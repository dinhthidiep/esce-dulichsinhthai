import React from 'react'
import { Link } from 'react-router-dom'
import './Button.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  asChild?: boolean
  to?: string
}

const Button = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  asChild,
  ...props
}: ButtonProps) => {
  const variantClass = `ui-button-${variant}`
  const sizeClass = `ui-button-${size}`
  const buttonClasses = ['ui-button', variantClass, sizeClass, className].filter(Boolean).join(' ')

  if (asChild && props.to) {
    return (
      <Link to={props.to} className={buttonClasses} onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>)}>
        {children}
      </Link>
    )
  }

  return (
    <button className={buttonClasses} onClick={onClick} {...props}>
      {children}
    </button>
  )
}

export default Button



























