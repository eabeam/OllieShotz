'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useChildProfile } from '@/lib/hooks/useChildProfile'

interface TeamColorContextType {
  primaryColor: string
  secondaryColor: string
}

const TeamColorContext = createContext<TeamColorContextType>({
  primaryColor: '#1e40af',
  secondaryColor: '#ffffff',
})

export function TeamColorProvider({ children }: { children: ReactNode }) {
  const { profile } = useChildProfile()

  const primaryColor = profile?.primary_color || '#1e40af'
  const secondaryColor = profile?.secondary_color || '#ffffff'

  useEffect(() => {
    document.documentElement.style.setProperty('--team-primary', primaryColor)
    document.documentElement.style.setProperty('--team-secondary', secondaryColor)
  }, [primaryColor, secondaryColor])

  return (
    <TeamColorContext.Provider value={{ primaryColor, secondaryColor }}>
      {children}
    </TeamColorContext.Provider>
  )
}

export function useTeamColors() {
  return useContext(TeamColorContext)
}
