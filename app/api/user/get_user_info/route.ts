import { handleRequestWithoutVerify } from "@/lib/middleware";
import { cookies } from "next/headers";
export async function GET(request: Request) {
    const api_key = (await cookies()).get('api_key')?.value;
    console.log(api_key);
    return handleRequestWithoutVerify(request, `/api/get_user_info?api_key=${api_key}`);
}
