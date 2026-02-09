import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: childId } = await params
    const cookieStore = await cookies()

    // Check for PIN session
    const pinSession = cookieStore.get('pin_session')?.value
    const pinChildId = cookieStore.get('pin_child_id')?.value

    if (!pinSession || !pinChildId || pinChildId !== childId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use admin client to fetch profile
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify session is valid
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('pin_sessions')
      .select('id')
      .eq('anon_user_id', pinSession)
      .eq('child_id', childId)
      .eq('revoked', false)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Fetch the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('child_profiles')
      .select('*')
      .eq('id', childId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
