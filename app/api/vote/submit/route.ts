import { handleRequestWithVerify } from "@/lib/middleware";

export async function POST(request: Request) {
  const { record } = await request.json();
  return handleRequestWithVerify(request, "/api/vote/submit", "POST", { record });
}