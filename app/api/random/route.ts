import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { count } = await request.json()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/random?count=${count}`);
    const data = await response.json();
    return NextResponse.json(data);
}