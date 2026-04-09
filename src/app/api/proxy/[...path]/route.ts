import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

function getBackendBase() {
  const value = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
  if (!value) {
    throw new Error("Missing BACKEND_API_URL");
  }
  return value;
}

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const backendBase = getBackendBase();
  const backendUrl = new URL(`${backendBase}/${path.join("/")}`);
  backendUrl.search = request.nextUrl.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && key.toLowerCase() !== "cookie") {
      headers.set(key, value);
    }
  });

  const sharedSecret = (process.env.BACKEND_PROXY_SECRET || "").trim();
  if (sharedSecret) {
    headers.set("x-agribot-proxy-secret", sharedSecret);
  }

  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    body = await request.text();
  }

  const backendResponse = await fetch(backendUrl.toString(), {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context);
}
