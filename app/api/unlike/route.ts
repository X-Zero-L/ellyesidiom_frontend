import { handleRequestWithVerify } from "@/lib/middleware";

export async function POST(request: Request) {
  const { image_hash } = await request.json();
  return handleRequestWithVerify(request, "/api/unlike", "POST", { image_hash });
}