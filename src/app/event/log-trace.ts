import { supabase } from '@/lib/supabase'

export async function logTraceEvent(batchId: string, eventData: any) {
  const { data, error } = await supabase
    .from('trace_events')
    .insert([{ batch_id: batchId, ...eventData }])
    .select()
  if (error) {
    console.error('Error logging trace event:', error)
    return { success: false, error }
  }
  return { success: true, data }
}