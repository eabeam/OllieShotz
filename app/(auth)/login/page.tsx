'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for the magic link!',
      })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">OllieShotz</h1>
          <p className="text-[var(--foreground)]/60">Track your goalie&apos;s performance</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
            >
              Send Magic Link
            </Button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-[var(--save-green)]/20 text-[var(--save-green)]'
                  : 'bg-[var(--goal-red)]/20 text-[var(--goal-red)]'
              }`}
            >
              {message.text}
            </div>
          )}
        </Card>

        <p className="text-center text-sm text-[var(--foreground)]/40 mt-6">
          No password needed. We&apos;ll send you a magic link.
        </p>

        {/* PIN Login Link */}
        <div className="text-center mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--foreground)]/60 mb-2">
            Have a PIN?
          </p>
          <Link
            href="/pin-login"
            className="text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Enter PIN for Quick Access
          </Link>
        </div>
      </div>
    </div>
  )
}
