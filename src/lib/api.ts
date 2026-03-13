export function getApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:5000";
  return `${base}${path}`;
}