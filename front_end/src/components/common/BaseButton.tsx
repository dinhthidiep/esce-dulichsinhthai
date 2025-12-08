import Button, { type ButtonProps as MuiButtonProps } from '@mui/material/Button'
import { cn } from '~/utils/tailwind.utils'
import { cva, type VariantProps } from 'class-variance-authority'
import CircularProgress from '@mui/material/CircularProgress'

// Định nghĩa variants bằng cva (Tailwind)
const buttonVariants = cva('', {
  variants: {
    twVariant: {
      normal: '',
      contained: 'shadow-sm text-white',
      outlined: 'border-2 bg-transparent',
      text: 'bg-transparent',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
      gradient:
        'bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
    },
    twSize: {
      normal: '',
      small: 'px-3 py-1.5 text-sm rounded-lg',
      medium: 'px-5 py-2.5 text-base rounded-xl',
      large: 'px-7 py-3.5 text-lg rounded-xl',
      extraLarge: 'px-9 py-4 text-xl rounded-2xl',
      icon: 'p-2 rounded-full'
    }
  },
  defaultVariants: {
    twVariant: 'normal',
    twSize: 'normal'
  }
})

// Props type
export type BaseButtonProps = MuiButtonProps &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
    className?: string
  }

// Component chính
const BaseButton = ({
  children,
  loading,
  twVariant,
  twSize,
  className,
  disabled,
  ...props
}: BaseButtonProps) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      className={cn(buttonVariants({ twVariant, twSize }), className)}
    >
      {loading && <CircularProgress size={20} className="loading-spinner" />}
      {children}
    </Button>
  )
}

export default BaseButton
