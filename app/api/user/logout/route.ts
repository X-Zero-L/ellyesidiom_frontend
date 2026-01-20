import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
export async function POST (request: Request) {
  // 登出只需要清除cookie中的api_key，user_id
  const cookieStore = await cookies()
  cookieStore.delete('api_key')
  cookieStore.delete('user_id')
  return NextResponse.json({ message: '登出成功' })
}
