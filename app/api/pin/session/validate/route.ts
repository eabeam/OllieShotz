import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { sessionToken, childId } = await request.json()

    if (!sessionToken || !childId) {
      return NextResponse.json(
        { valid: false, error: 'Missing session token or child ID' },
        { status: 400 }
      )
    }

    // Use admin client to check session
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if session exists and is not revoked
    const { data: session, error } = await supabaseAdmin
      .from('pin_sessions')
      .select('id, child_id')
      .eq('anon_user_id', sessionToken)
      .eq('child_id', childId)
      .eq('revoked', false)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { valid: false },
        { status: 401 }
      )
    }

    // Update last_used_at
    await supabaseAdmin
      .from('pin_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', session.id)

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
