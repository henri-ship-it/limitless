'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'

async function requireMember() {
  if (!supabaseConfigured) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  return { supabase, userId: user.id }
}

export async function toggleWeek(week: number, done: boolean) {
  const session = await requireMember()
  if (!session) return
  const { supabase, userId } = session

  if (done) {
    await supabase.from('member_progress').upsert({ member_id: userId, week_number: week })
  } else {
    await supabase
      .from('member_progress')
      .delete()
      .eq('member_id', userId)
      .eq('week_number', week)
  }

  revalidatePath('/', 'layout')
}

export async function toggleChecklistItem(key: string, done: boolean) {
  const session = await requireMember()
  if (!session) return
  const { supabase, userId } = session

  if (done) {
    await supabase.from('member_checklist').upsert({ member_id: userId, item_key: key })
  } else {
    await supabase.from('member_checklist').delete().eq('member_id', userId).eq('item_key', key)
  }

  revalidatePath('/', 'layout')
}
