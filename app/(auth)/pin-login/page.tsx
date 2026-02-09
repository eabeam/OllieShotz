'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function PinLoginPage() {
  const router = useRouter()
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    setError(null)

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (value && index === 5) {
      const fullPin = newPin.join('')
      if (fullPin.length === 6) {
        handleSubmit(fullPin)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

    if (pastedData.length === 6) {
      const newPin = pastedData.split('')
      setPin(newPin)
      inputRefs.current[5]?.focus()
      handleSubmit(pastedData)
    }
  }

  const handleSubmit = async (pinValue?: string) => {
    const fullPin = pinValue || pin.join('')

    if (fullPin.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid PIN')
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setPin(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        setLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to verify PIN. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPin(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">OllieShotz</h1>
          <p className="text-[var(--foreground)]/60">Enter your 6-digit PIN</p>
        </div>

        <Card padding="lg">
          {/* PIN Input Grid */}
          <div
            className={`flex justify-center gap-2 mb-6 ${shake ? 'animate-shake' : ''}`}
            onPaste={handlePaste}
          >
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className={`
                  w-12 h-14 text-center text-2xl font-bold
                  bg-[var(--muted)]/30 border-2 border-[var(--border)]
                  rounded-xl focus:outline-none focus:border-[var(--primary)]
                  transition-colors disabled:opacity-50
                  ${error ? 'border-[var(--goal-red)]' : ''}
                `}
                aria-label={`PIN digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-[var(--goal-red)]/20 text-[var(--goal-red)] text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            fullWidth
            size="lg"
            loading={loading}
            onClick={() => handleSubmit()}
            disabled={pin.some(d => !d)}
          >
            Enter
          </Button>

          {/* Help Text */}
          <p className="text-center text-sm text-[var(--foreground)]/40 mt-4">
            Ask the account owner for the PIN
          </p>
        </Card>

        {/* Alternative Login Link */}
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Sign in with email instead
          </Link>
        </div>
      </div>

      {/* Shake Animation Style */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
