import { handleRequestWithVerify } from "@/lib/middleware";

export async function POST(request: Request) {
  const { image_hash } = await request.json();
  return handleRequestWithVerify(request, "/api/hate", "POST", { image_hash });
}