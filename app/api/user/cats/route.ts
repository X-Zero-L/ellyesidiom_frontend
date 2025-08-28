import { handleRequestWithVerify } from "@/lib/middleware";

export async function GET(request: Request) {
  return handleRequestWithVerify(request, "/api/cats");
}