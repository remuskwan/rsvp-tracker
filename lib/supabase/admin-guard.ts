import { redirect } from 'next/navigation'
import { createClient } from './server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect('/admin/login')
  }

  const { data } = await supabase
    .from('admins')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()

  if (!data) {
    redirect('/admin/login')
  }

  return user
}
