import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has a child profile set up
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check for existing profile (owner or family member)
        const { data: ownedProfiles } = await supabase
          .from('child_profiles')
          .select('id')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)

        const { data: familyAccess } = await supabase
          .from('family_members')
          .select('child_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .limit(1)

        // If no profile access, redirect to setup
        const hasOwnedProfile = !!ownedProfiles && ownedProfiles.length > 0

        if (!hasOwnedProfile && (!familyAccess || familyAccess.length === 0)) {
          // Check for pending invites
          const { data: pendingInvites } = await supabase
            .from('family_members')
            .select('id, child_id')
            .eq('email', user.email!)
            .eq('status', 'pending')

          if (pendingInvites && pendingInvites.length > 0) {
            // Accept the invite automatically
            await supabase
              .from('family_members')
              .update({
                user_id: user.id,
                status: 'accepted',
                accepted_at: new Date().toISOString(),
              })
              .eq('id', pendingInvites[0].id)

            return NextResponse.redirect(`${origin}${next}`)
          }

          return NextResponse.redirect(`${origin}/setup`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
