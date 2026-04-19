import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const bodyPart = url.searchParams.get('bodyPart') || 'chest'
    const limit = url.searchParams.get('limit') || '10'
    const search = url.searchParams.get('search') || ''

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY')

    if (!RAPIDAPI_KEY) {
      return new Response(
        JSON.stringify({ error: 'No API key configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let apiUrl = ''
    if (search) {
      apiUrl = 'https://exercisedb.p.rapidapi.com/exercises/name/' + encodeURIComponent(search) + '?limit=' + limit
    } else {
      apiUrl = 'https://exercisedb.p.rapidapi.com/exercises/bodyPart/' + encodeURIComponent(bodyPart) + '?limit=' + limit
    }

    const response = await fetch(apiUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    })

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
