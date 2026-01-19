'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useChildProfile } from '@/lib/hooks/useChildProfile'
import { useTheme } from '@/lib/context/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { FamilyMember } from '@/lib/types/database'

const colorOptions = [
  { name: 'Blue', primary: '#1e40af', secondary: '#ffffff' },
  { name: 'Hawks', primary: '#e60000', secondary: '#ffffff', accent: '#000000' },
  { name: 'Green', primary: '#16a34a', secondary: '#ffffff' },
  { name: 'Purple', primary: '#7c3aed', secondary: '#ffffff' },
  { name: 'Orange', primary: '#ea580c', secondary: '#ffffff' },
  { name: 'Black', primary: '#171717', secondary: '#fbbf24' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { profile, updateProfile, loading: profileLoading } = useChildProfile()
  const { theme, toggleTheme } = useTheme()
  const [name, setName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [selectedColor, setSelectedColor] = useState(colorOptions[0])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Family sharing
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setTeamName(profile.team_name || '')
      setJerseyNumber(profile.jersey_number || '')
      const color = colorOptions.find(c => c.primary === profile.primary_color) || colorOptions[0]
      setSelectedColor(color)
    }
  }, [profile])

  useEffect(() => {
    if (!profile) return

    async function fetchFamilyMembers() {
      const supabase = createClient()
      const { data } = await supabase
        .from('family_members')
        .select('*')
        .eq('child_id', profile!.id)
        .order('invited_at', { ascending: false })

      if (data) {
        setFamilyMembers(data)
      }
    }

    fetchFamilyMembers()
  }, [profile])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setMessage(null)

    const error = await updateProfile({
      name,
      team_name: teamName || null,
      jersey_number: jerseyNumber || null,
      primary_color: selectedColor.primary,
      secondary_color: selectedColor.secondary,
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Settings saved!' })
    }

    setSaving(false)
  }

  const handleInvite = async () => {
    if (!profile || !inviteEmail) return
    setInviting(true)

    const supabase = createClient()

    const { error } = await supabase
      .from('family_members')
      .insert({
        child_id: profile.id,
        email: inviteEmail,
        status: 'pending',
        role: 'editor',
      })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      // Refresh family members
      const { data } = await supabase
        .from('family_members')
        .select('*')
        .eq('child_id', profile.id)
        .order('invited_at', { ascending: false })

      if (data) {
        setFamilyMembers(data)
      }

      setInviteEmail('')
      setShowInviteModal(false)
      setMessage({ type: 'success', text: 'Invite sent! They can sign in with their email to access.' })
    }

    setInviting(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    const supabase = createClient()

    await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId)

    setFamilyMembers(prev => prev.filter(m => m.id !== memberId))
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground)]/60">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    router.push('/setup')
    return null
  }

  return (
    <div className="p-4 safe-top">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Profile Settings */}
      <Card className="mb-6" padding="lg">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>

        <div className="space-y-4">
          <Input
            label="Goalie's Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Optional"
          />

          <Input
            label="Jersey Number"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            placeholder="Optional"
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
                    relative h-14 rounded-xl transition-all overflow-hidden
                    ${selectedColor.name === color.name
                      ? 'ring-4 ring-white ring-offset-2 ring-offset-[var(--background)] scale-105 shadow-lg'
                      : 'opacity-70 hover:opacity-100'
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
                    className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                    style={{ color: color.secondary }}
                  >
                    {color.name}
                  </span>
                  {/* Checkmark for selected */}
                  {selectedColor.name === color.name && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill={color.primary} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} loading={saving} fullWidth>
            Save Changes
          </Button>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-[var(--save-green)]/20 text-[var(--save-green)]'
                  : 'bg-[var(--goal-red)]/20 text-[var(--goal-red)]'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </Card>

      {/* Appearance */}
      <Card className="mb-6" padding="lg">
        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Theme</div>
            <div className="text-sm text-[var(--foreground)]/60">
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="relative w-14 h-8 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--primary)' : 'var(--muted)'
            }}
          >
            <span
              className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center"
              style={{
                transform: theme === 'dark' ? 'translateX(28px)' : 'translateX(4px)'
              }}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-[var(--primary)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </Card>

      {/* Family Sharing */}
      <Card className="mb-6" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Family Sharing</h2>
          <Button size="sm" onClick={() => setShowInviteModal(true)}>
            Invite
          </Button>
        </div>

        <p className="text-sm text-[var(--foreground)]/60 mb-4">
          Invite family members to track games together. They&apos;ll be able to view and record stats.
        </p>

        {familyMembers.length === 0 ? (
          <p className="text-center text-[var(--foreground)]/40 py-4">
            No family members added yet
          </p>
        ) : (
          <div className="space-y-2">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-2 px-3 bg-[var(--muted)]/30 rounded-lg"
              >
                <div>
                  <div className="font-medium text-sm">{member.email}</div>
                  <div className="text-xs text-[var(--foreground)]/60">
                    {member.status === 'pending' ? 'Pending' : 'Active'}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-[var(--foreground)]/40 hover:text-[var(--goal-red)] p-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sign Out */}
      <Button variant="danger" fullWidth onClick={handleSignOut}>
        Sign Out
      </Button>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Family Member"
      >
        <p className="text-[var(--foreground)]/60 mb-4">
          Enter their email address. They&apos;ll get access when they sign in.
        </p>
        <Input
          type="email"
          placeholder="family@example.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <div className="flex gap-3 mt-4 mb-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowInviteModal(false)}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={handleInvite}
            loading={inviting}
            disabled={!inviteEmail}
          >
            Send Invite
          </Button>
        </div>
      </Modal>
    </div>
  )
}
