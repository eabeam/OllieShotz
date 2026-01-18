'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChildProfile } from '@/lib/types/database'

export function useChildProfile() {
  const [profile, setProfile] = useState<ChildProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // First check for owned profile
      const { data: ownedProfile, error: ownedError } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (ownedProfile) {
        setProfile(ownedProfile)
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
        const { data: sharedProfile, error: sharedError } = await supabase
          .from('child_profiles')
          .select('*')
          .eq('id', familyAccess[0].child_id)
          .single()

        if (sharedProfile) {
          setProfile(sharedProfile)
        } else if (sharedError) {
          setError(sharedError.message)
        }
      } else if (ownedError && ownedError.code !== 'PGRST116') {
        setError(ownedError.message)
      }

      setLoading(false)
    }

    fetchProfile()
  }, [])

  const updateProfile = async (updates: Partial<ChildProfile>) => {
    if (!profile) return

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

  return { profile, loading, error, updateProfile }
}
