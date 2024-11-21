import { NextResponse } from "next/server";
import { handleRequestWithVerify} from "@/lib/middleware";

export async function GET(request: Request) {
  return handleRequestWithVerify(request, "/api/get_review_list");
}

export async function POST(request: Request) {
  const { image_hash, under_review } = await request.json();
  return handleRequestWithVerify(request, "/api/review", "POST", { image_hash, under_review });
}