import { handleRequestWithoutVerify } from '@/lib/middleware'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { public_key, private_key } = await request.json()
  const r = await handleRequestWithoutVerify(
    request,
    '/api/check_verification',
    'POST',
    {
      public_key,
      private_key
    }
  )
  
  const responseData = await r.json()
  const data = responseData.data

  if (data.verified) {
    const cookieStore = await cookies()
    cookieStore.set('user_id', data.user_id, {
      maxAge: 60 * 60 * 24 * 7
    })
    cookieStore.set('api_key', data.api_key, {
      maxAge: 60 * 60 * 24 * 7
    })
  }

  return NextResponse.json(responseData)
}

