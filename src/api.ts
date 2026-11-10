const configured = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE = configured || "";

// Deliberately kept only in memory for test deployments. A refresh signs the user out.
let activeApiKey = "";
export const setActiveApiKey = (value: string) => { activeApiKey = value.trim(); };
export const clearActiveApiKey = () => { activeApiKey = ""; };

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (activeApiKey) headers.set("x-api-key", activeApiKey);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(body?.message || `HTTP ${response.status}`, response.status, body);
  }
  return body as T;
}
/** Authenticated download: browser <a href> cannot attach x-api-key in tenant mode. */
export async function downloadFile(path: string, fileName: string) {
  const headers = new Headers();
  if (activeApiKey) headers.set("x-api-key", activeApiKey);
  const response = await fetch(`${API_BASE}${path}`, { headers });
  if (!response.ok) throw new ApiError(`Download failed (${response.status})`, response.status, null);
  const blobUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
