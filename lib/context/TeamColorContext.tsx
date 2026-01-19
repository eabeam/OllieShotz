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

// Helper to lighten a hex color
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * (percent / 100)))
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * (percent / 100)))
  const b = Math.min(255, Math.floor((num & 0x0000ff) + (255 - (num & 0x0000ff)) * (percent / 100)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export function TeamColorProvider({ children }: { children: ReactNode }) {
  const { profile } = useChildProfile()

  const primaryColor = profile?.primary_color || '#1e40af'
  const secondaryColor = profile?.secondary_color || '#ffffff'

  useEffect(() => {
    document.documentElement.style.setProperty('--team-primary', primaryColor)
    document.documentElement.style.setProperty('--team-secondary', secondaryColor)
    // Also set --primary so team color is used throughout the app
    document.documentElement.style.setProperty('--primary', primaryColor)
    // Create a lighter version for --primary-light
    const lighterColor = lightenColor(primaryColor, 30)
    document.documentElement.style.setProperty('--primary-light', lighterColor)
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
