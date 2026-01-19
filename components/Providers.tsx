'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from '@/lib/context/ThemeContext'
import { TeamColorProvider } from '@/lib/context/TeamColorContext'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TeamColorProvider>
        {children}
      </TeamColorProvider>
    </ThemeProvider>
  )
}
