'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const colorOptions = [
  { name: 'Blue', primary: '#1e40af', secondary: '#ffffff' },
  { name: 'Red', primary: '#dc2626', secondary: '#ffffff' },
  { name: 'Green', primary: '#16a34a', secondary: '#ffffff' },
  { name: 'Purple', primary: '#7c3aed', secondary: '#ffffff' },
  { name: 'Orange', primary: '#ea580c', secondary: '#ffffff' },
  { name: 'Black', primary: '#171717', secondary: '#fbbf24' },
]

export default function SetupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [selectedColor, setSelectedColor] = useState(colorOptions[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('child_profiles')
      .insert({
        owner_id: user.id,
        name,
        team_name: teamName || null,
        primary_color: selectedColor.primary,
        secondary_color: selectedColor.secondary,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Set Up Profile</h1>
          <p className="text-[var(--foreground)]/60">Tell us about your goalie</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Goalie's Name"
              placeholder="e.g., Oliver"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Team Name (optional)"
              placeholder="e.g., Maple Leafs"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]/80 mb-3">
                Team Colors
              </label>
              <div className="grid grid-cols-3 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`
                      relative h-14 rounded-xl border-2 transition-all
                      ${selectedColor.name === color.name
                        ? 'border-white scale-105'
                        : 'border-transparent'
                      }
                    `}
                    style={{ backgroundColor: color.primary }}
                  >
                    <span
                      className="absolute inset-0 flex items-center justify-center text-sm font-medium"
                      style={{ color: color.secondary }}
                    >
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--goal-red)]/20 text-[var(--goal-red)] text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
            >
              Continue
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
