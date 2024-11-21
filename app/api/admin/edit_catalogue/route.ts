import { handleRequestWithVerify} from "@/lib/middleware";
export async function POST(request: Request) {
  const { image_hash, catalogue } = await request.json();
  return handleRequestWithVerify(request, "/api/edit_catalogue", "POST", {
    image_hash,
    catalogue,
  });
}
