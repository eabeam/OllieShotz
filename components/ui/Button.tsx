'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'save' | 'goal' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white',
  secondary: 'bg-[var(--muted)] hover:bg-[var(--border)] text-white',
  save: 'bg-[var(--save-green)] hover:bg-[var(--save-green-dark)] active:bg-[var(--save-green-dark)] text-white',
  goal: 'bg-[var(--goal-red)] hover:bg-[var(--goal-red-dark)] active:bg-[var(--goal-red-dark)] text-white',
  danger: 'bg-[var(--goal-red)] hover:bg-[var(--goal-red-dark)] text-white',
  ghost: 'bg-transparent hover:bg-[var(--muted)] text-[var(--foreground)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-6 py-3 text-lg rounded-xl',
  xl: 'px-8 py-6 text-2xl font-bold rounded-2xl min-h-[120px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className = '',
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    children,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          font-medium
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:ring-offset-2 focus:ring-offset-[var(--background)]
          disabled:opacity-50 disabled:cursor-not-allowed
          select-none
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {children}
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
