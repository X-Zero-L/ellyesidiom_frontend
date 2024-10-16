import { handleRequest } from "@/lib/middleware";

export async function GET(request: Request) {
  return handleRequest(request, "/api/cats");
}