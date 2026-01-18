'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--foreground)]/80 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full
            px-4 py-3
            bg-[var(--muted)]/50
            border border-[var(--border)]
            rounded-xl
            text-[var(--foreground)]
            placeholder:text-[var(--foreground)]/40
            focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent
            transition-colors
            ${error ? 'border-[var(--goal-red)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[var(--goal-red)]">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
