import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Hash function for PIN storage
async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate random 6-digit PIN
function generatePin(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const pin = (array[0] % 1000000).toString().padStart(6, '0')
  return pin
}

// Generate random salt
function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

// POST: Generate new PIN (owner only)
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's owned profile
    const { data: profiles, error: profileError } = await supabase
      .from('child_profiles')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const profile = profiles?.[0]

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found or not authorized' },
        { status: 403 }
      )
    }

    // Generate new PIN
    const pin = generatePin()
    const salt = generateSalt()
    const hash = await hashPin(pin, salt)
    const pinHash = `${salt}:${hash}`

    // Update profile with new PIN
    const { error: updateError } = await supabase
      .from('child_profiles')
      .update({
        pin_hash: pinHash,
        pin_enabled: true,
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Error updating PIN:', updateError)
      return NextResponse.json(
        { error: 'Failed to generate PIN' },
        { status: 500 }
      )
    }

    // Return the plain PIN (only time it's visible)
    return NextResponse.json({
      success: true,
      pin: pin,
    })
  } catch (error) {
    console.error('PIN generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Revoke all PIN sessions (owner only)
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's owned profile
    const { data: profiles, error: profileError } = await supabase
      .from('child_profiles')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const profile = profiles?.[0]

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found or not authorized' },
        { status: 403 }
      )
    }

    // Use admin client to revoke all sessions
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Revoke all PIN sessions for this profile
    const { error: revokeError } = await supabaseAdmin
      .from('pin_sessions')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('child_id', profile.id)
      .eq('revoked', false)

    if (revokeError) {
      console.error('Error revoking sessions:', revokeError)
      return NextResponse.json(
        { error: 'Failed to revoke sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'All PIN sessions revoked',
    })
  } catch (error) {
    console.error('PIN revocation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Toggle PIN enabled/disabled (owner only)
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient()
    const { enabled } = await request.json()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's owned profile
    const { data: profiles, error: profileError } = await supabase
      .from('child_profiles')
      .select('id, pin_hash')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const profile = profiles?.[0]

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found or not authorized' },
        { status: 403 }
      )
    }

    // Cannot enable PIN if no PIN has been generated
    if (enabled && !profile.pin_hash) {
      return NextResponse.json(
        { error: 'Generate a PIN first' },
        { status: 400 }
      )
    }

    // Update pin_enabled status
    const { error: updateError } = await supabase
      .from('child_profiles')
      .update({ pin_enabled: enabled })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Error updating PIN status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update PIN status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enabled: enabled,
    })
  } catch (error) {
    console.error('PIN toggle error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Get PIN status and active session count (owner only)
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's owned profile
    const { data: profiles, error: profileError } = await supabase
      .from('child_profiles')
      .select('id, pin_enabled, pin_hash')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const profile = profiles?.[0]

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found or not authorized' },
        { status: 403 }
      )
    }

    // Use admin client to count active sessions
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { count, error: countError } = await supabaseAdmin
      .from('pin_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', profile.id)
      .eq('revoked', false)

    return NextResponse.json({
      hasPin: !!profile.pin_hash,
      pinEnabled: profile.pin_enabled,
      activeSessions: count || 0,
    })
  } catch (error) {
    console.error('PIN status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
