import { handleRequestWithVerify } from "@/lib/middleware";

export async function POST(request: Request) {
  const { images, tags, comment, catalogue } = await request.json();
  return handleRequestWithVerify(request, "/api/upload", "POST", {
    images,
    tags,
    comment,
    catalogue,
  });
}