import { handleRequest } from "@/lib/middleware";
export async function POST(request: Request) {
  const { image_hash, catalogue } = await request.json();
  return handleRequest(request, "/api/edit_catalogue", "POST", {
    image_hash,
    catalogue,
  });
}
