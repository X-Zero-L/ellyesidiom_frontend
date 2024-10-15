import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { keyword } = await request.json()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?keyword=${encodeURIComponent(keyword)}`);
    const data = await response.json();
    return NextResponse.json(data);
}