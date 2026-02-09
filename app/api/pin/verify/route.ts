import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Rate limiting: track attempts per IP
const attemptsByIp = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 1000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = attemptsByIp.get(ip)

  if (!record || now > record.resetAt) {
    attemptsByIp.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false
  }

  record.count++
  return true
}

// Simple hash function for PIN comparison
async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Timing-safe comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a minute.' },
        { status: 429 }
      )
    }

    const { pin } = await request.json()

    if (!pin || typeof pin !== 'string' || pin.length !== 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: 'Invalid PIN format' },
        { status: 400 }
      )
    }

    // Create admin client to query all profiles with PIN enabled
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find profiles with PIN enabled
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('child_profiles')
      .select('id, pin_hash, name')
      .eq('pin_enabled', true)
      .not('pin_hash', 'is', null)

    if (profilesError || !profiles) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to verify PIN' },
        { status: 500 }
      )
    }

    // Find matching profile
    let matchedProfile: { id: string; name: string } | null = null

    for (const profile of profiles) {
      if (!profile.pin_hash) continue

      // PIN hash format: "salt:hash"
      const [salt, storedHash] = profile.pin_hash.split(':')
      if (!salt || !storedHash) continue

      const computedHash = await hashPin(pin, salt)

      if (timingSafeEqual(computedHash, storedHash)) {
        matchedProfile = { id: profile.id, name: profile.name }
        break
      }
    }

    if (!matchedProfile) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    // Generate a session token
    const sessionToken = crypto.randomUUID()

    // Record the PIN session in database
    const { error: pinSessionError } = await supabaseAdmin
      .from('pin_sessions')
      .insert({
        child_id: matchedProfile.id,
        anon_user_id: sessionToken, // Repurposing this field for session token
        device_info: request.headers.get('user-agent') || null,
      })

    if (pinSessionError) {
      console.error('Error recording PIN session:', pinSessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Set secure cookies
    const cookieStore = await cookies()

    cookieStore.set('pin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    cookieStore.set('pin_child_id', matchedProfile.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      childId: matchedProfile.id,
      playerName: matchedProfile.name,
    })
  } catch (error) {
    console.error('PIN verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
