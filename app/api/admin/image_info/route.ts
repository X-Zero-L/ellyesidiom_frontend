import { handleRequestWithVerify} from "@/lib/middleware";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const image_hash = url.searchParams.get('image_hash');
  return handleRequestWithVerify(request, `/api/image/info?image_hash=${image_hash}`);
}
