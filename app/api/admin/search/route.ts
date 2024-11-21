import { handleRequestWithVerify} from "@/lib/middleware";

export async function POST(request: Request) {
  const { keyword, under_review, limit } = await request.json();
  return handleRequestWithVerify(request, "/api/admin/search", "POST", {
    keyword,
    under_review,
    limit,
  });
}
