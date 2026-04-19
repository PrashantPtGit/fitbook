import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const imageId = url.searchParams.get('id')

  if (!imageId) {
    return new Response('Missing id', { status: 400 })
  }

  const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY')!

  const response = await fetch(
    'https://exercisedb.p.rapidapi.com/image/' + imageId,
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    }
  )

  const buffer = await response.arrayBuffer()

  return new Response(buffer, {
    headers: {
      ...corsHeaders,
      'Content-Type': response.headers.get('Content-Type') || 'image/gif',
      'Cache-Control': 'public, max-age=86400'
    }
  })
})
