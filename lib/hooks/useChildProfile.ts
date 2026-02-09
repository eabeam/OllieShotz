'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChildProfile } from '@/lib/types/database'

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

export function useChildProfile() {
  const [profile, setProfile] = useState<ChildProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPinSession, setIsPinSession] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createClient()

        // Check for PIN session first
        const pinChildId = getCookie('pin_child_id')
        const pinSession = getCookie('pin_session')

        if (pinChildId && pinSession) {
          // Validate PIN session with server
          const response = await fetch('/api/pin/session/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken: pinSession, childId: pinChildId }),
          })

          if (response.ok) {
            // Load profile directly (PIN sessions use service role on server)
            const profileResponse = await fetch(`/api/profile/${pinChildId}`)
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              setProfile(profileData)
              setIsPinSession(true)
              setLoading(false)
              return
            }
          }

          // PIN session invalid - clear cookies and continue with normal auth
          document.cookie = 'pin_session=; path=/; max-age=0'
          document.cookie = 'pin_child_id=; path=/; max-age=0'
        }

        // Normal auth flow
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          console.log('No user found or auth error:', authError)
          setLoading(false)
          return
        }

        // First check for owned profile
        const { data: ownedProfiles, error: ownedError } = await supabase
          .from('child_profiles')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)

        if (ownedProfiles && ownedProfiles.length > 0) {
          setProfile(ownedProfiles[0])
          setLoading(false)
          return
        }

        // Check for family access
        const { data: familyAccess } = await supabase
          .from('family_members')
          .select('child_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .limit(1)

        if (familyAccess && familyAccess.length > 0) {
          const { data: sharedProfiles, error: sharedError } = await supabase
            .from('child_profiles')
            .select('*')
            .eq('id', familyAccess[0].child_id)
            .limit(1)

          if (sharedProfiles && sharedProfiles.length > 0) {
            setProfile(sharedProfiles[0])
          } else if (sharedError) {
            setError(sharedError.message)
          }
        } else if (ownedError) {
          console.log('No owned profile found:', ownedError.message)
        }

        // New user with no profile - this is expected
        console.log('No profile found for user, should redirect to setup')
        setLoading(false)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const updateProfile = async (updates: Partial<ChildProfile>) => {
    if (!profile) return

    // PIN session users cannot update profile
    if (isPinSession) {
      return { message: 'PIN users cannot modify settings' }
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('child_profiles')
      .update(updates)
      .eq('id', profile.id)

    if (!error) {
      setProfile({ ...profile, ...updates })
    }

    return error
  }

  const signOutPinSession = () => {
    document.cookie = 'pin_session=; path=/; max-age=0'
    document.cookie = 'pin_child_id=; path=/; max-age=0'
    window.location.href = '/login'
  }

  return { profile, loading, error, updateProfile, isPinSession, signOutPinSession }
}
