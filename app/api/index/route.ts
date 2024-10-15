import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/index`);
    const data = await response.json();
    return NextResponse.json(data);
}