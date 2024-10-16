import { handleRequest } from "@/lib/middleware";
export async function POST(request: Request) {
  const { image_hash, tags, comment, catalogue } = await request.json();
  return handleRequest(request, "/api/admin/edit", "POST", {
    image_hash,
    tags,
    comment,
    catalogue,
  });
}
