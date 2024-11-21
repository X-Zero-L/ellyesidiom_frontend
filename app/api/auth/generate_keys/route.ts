import { handleRequestWithRateLimit } from "@/lib/rate_limit";
import { handleRequestWithoutVerify } from "@/lib/middleware";

export async function POST(request: Request) {
  return handleRequestWithRateLimit(request, "/api/generate_keys", (req) =>
    handleRequestWithoutVerify(req, "/api/generate_keys")
  );
}

