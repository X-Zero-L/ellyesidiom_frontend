import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { url } = await request.json()
    if (!url.match(/ap-shanghai.myqcloud.com/)) {
        return NextResponse.error()
    }
    const image = await fetch(url)
    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return NextResponse.json({ base64 })

}