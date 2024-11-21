import { handleRequestWithoutVerify } from "@/lib/middleware";

export async function GET(request: Request) {
  return handleRequestWithoutVerify(request, "/api/get_api_key", "POST");
}