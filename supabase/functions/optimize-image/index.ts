import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'product-images'
    const maxWidth = parseInt(formData.get('maxWidth') as string || '1920')
    const quality = parseFloat(formData.get('quality') as string || '0.85')

    if (!file) {
      throw new Error('No file provided')
    }

    console.log(`Processing image: ${file.name}, size: ${file.size} bytes`)

    // Read the file as array buffer
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // For WebP conversion, we would need an image processing library
    // Since Deno doesn't have native image processing, we'll upload the original
    // but with optimized settings
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = fileName

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year cache
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    console.log(`Image uploaded successfully: ${urlData.publicUrl}`)

    // Log the optimization event
    await supabase.from('audit_logs').insert({
      action_type: 'image_upload',
      entity_type: 'storage',
      entity_id: filePath,
      details: {
        original_size: file.size,
        file_name: file.name,
        bucket: bucket,
        public_url: urlData.publicUrl
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        originalSize: file.size
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error processing image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
