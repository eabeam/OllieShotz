'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const colorOptions = [
  { name: 'Blue', primary: '#1e40af', secondary: '#ffffff' },
  { name: 'Hawks', primary: '#cc0000', secondary: '#ffffff', accent: '#000000' },
  { name: 'Green', primary: '#16a34a', secondary: '#ffffff' },
  { name: 'Purple', primary: '#7c3aed', secondary: '#ffffff' },
  { name: 'Orange', primary: '#ea580c', secondary: '#ffffff' },
  { name: 'Black', primary: '#171717', secondary: '#fbbf24' },
]

export default function SetupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [selectedColor, setSelectedColor] = useState(colorOptions[0])
  const [loading, setLoading] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<string>('')

  // Check if profile already exists
  useEffect(() => {
    async function checkExistingProfile() {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      console.log('Setup: Checking user', { user: user?.id, authError })

      if (!user) {
        console.log('Setup: No user, redirecting to login')
        router.push('/login')
        return
      }

      const { data: profiles, error: profileError } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('owner_id', user.id)

      console.log('Setup: Profile check result', { profiles, profileError })

      if (profiles && profiles.length > 0) {
        // Profile already exists, go to dashboard
        console.log('Setup: Profile found, redirecting to dashboard')
        router.push('/dashboard')
        return
      }

      if (profileError) {
        console.error('Setup: Error checking profile', profileError)
        setError(`Error checking profile: ${profileError.message}`)
      }

      console.log('Setup: No profile found, showing form')
      setDebugInfo(`User: ${user.id}\nProfiles found: ${profiles?.length || 0}\nError: ${profileError?.message || 'None'}`)
      setCheckingProfile(false)
    }

    checkExistingProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Setup: Submitting form')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('Setup: No user on submit')
      setError('You must be logged in')
      setLoading(false)
      return
    }

    console.log('Setup: Re-checking existing profiles before insert', user.id)

    const { data: existingProfiles, error: existingError } = await supabase
      .from('child_profiles')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    if (existingError) {
      console.error('Setup: Error checking profile before insert', existingError)
      setError(`Error checking profile: ${existingError.message}`)
      setLoading(false)
      return
    }

    if (existingProfiles && existingProfiles.length > 0) {
      console.log('Setup: Profile already exists, redirecting to dashboard')
      router.push('/dashboard')
      return
    }

    console.log('Setup: Inserting profile for user', user.id)

    const { data: insertedProfile, error: insertError } = await supabase
      .from('child_profiles')
      .insert({
        owner_id: user.id,
        name,
        team_name: teamName || null,
        jersey_number: jerseyNumber || null,
        primary_color: selectedColor.primary,
        secondary_color: selectedColor.secondary,
      })
      .select()
      .single()

    console.log('Setup: Insert result', { insertedProfile, insertError })

    if (insertError) {
      console.error('Setup: Insert error', insertError)
      if (insertError.code === '23505') {
        console.log('Setup: Duplicate profile detected, redirecting to dashboard')
        router.push('/dashboard')
        return
      }
      setError(insertError.message)
      setDebugInfo(prev => prev + `\nInsert error: ${insertError.code} - ${insertError.message}`)
      setLoading(false)
      return
    }

    setDebugInfo(prev => prev + `\nInsert success! Profile ID: ${insertedProfile?.id}`)

    console.log('Setup: Success, redirecting to dashboard')
    router.push('/dashboard')
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground)]/60">Loading...</div>
      </div>
    )
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

            <Input
              label="Jersey Number (optional)"
              placeholder="e.g., 31"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              maxLength={3}
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
                      relative h-14 rounded-xl border-2 transition-all overflow-hidden
                      ${selectedColor.name === color.name
                        ? 'border-white scale-105'
                        : 'border-transparent'
                      }
                    `}
                    style={{ backgroundColor: color.primary }}
                  >
                    {/* Black accent stripe for Hawks */}
                    {'accent' in color && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2"
                        style={{ backgroundColor: color.accent }}
                      />
                    )}
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

            {debugInfo && (
              <div className="p-3 rounded-lg bg-[var(--muted)] text-[var(--foreground)]/60 text-xs font-mono whitespace-pre-wrap">
                Debug: {debugInfo}
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
