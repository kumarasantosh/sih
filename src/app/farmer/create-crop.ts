import { supabase } from '@/lib/supabase'

export async function createCropBatch(batchId: string, cropData: any) {
  const { data, error } = await supabase
    .from('batches')
    .insert([{ batch_id: batchId, ...cropData }])
    .select()
  if (error) {
    console.error('Error creating crop batch:', error)
    return { success: false, error }
  }
  return { success: true, data }
}