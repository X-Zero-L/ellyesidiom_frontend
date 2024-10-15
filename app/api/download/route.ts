import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { url } = await request.json()
    if (!url.match(/ap-shanghai.myqcloud.com/) && !url.match(/maxng.cc/) && !url.match(/ei-images.hypermax.app/)) {
        return NextResponse.error()
    }
    const image = await fetch(url.replace(/ap-shanghai.myqcloud.com|maxng.cc|ei-images.hypermax.app/, '100.89.168.94:3889').replace(/https/, 'http'))
    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return NextResponse.json({ base64 })

}