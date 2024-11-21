import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function verifyCookie() {
  const adminToken = cookies().get("adminToken")?.value;
  if ((adminToken as string) !== (process.env.EI_API_KEY as string)) {
    return "Unauthorized";
  }
  return adminToken;
}

export async function handleRequest(request: Request, endpoint: string, method: string = "GET", body?: any) {
  const adminToken = await verifyCookie();
  if (adminToken === "Unauthorized") {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${adminToken}`,
  };

  if (method === "POST" && body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return NextResponse.json(await response.json());
}

// 不需要验证，直接转发请求
export async function handleRequestWithoutVerify(request: Request, endpoint: string, method: string = "GET", body?: any) {
  const headers: HeadersInit = {};

  if (method === "POST" && body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return NextResponse.json(await response.json());
}