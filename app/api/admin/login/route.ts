import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CORRECT_PASSWORD = process.env.EI_API_KEY!!

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password === CORRECT_PASSWORD) {
    cookies().set('adminToken', CORRECT_PASSWORD, {
        maxAge: 60 * 60 * 24 * 7,
    })
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ success: false }, { status: 401 })
  }
}