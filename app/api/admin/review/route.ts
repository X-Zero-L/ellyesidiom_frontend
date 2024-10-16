import { NextResponse } from "next/server";
import { handleRequest } from "@/lib/middleware";

export async function GET(request: Request) {
  return handleRequest(request, "/api/get_review_list");
}

export async function POST(request: Request) {
  const { image_hash, under_review } = await request.json();
  return handleRequest(request, "/api/review", "POST", { image_hash, under_review });
}