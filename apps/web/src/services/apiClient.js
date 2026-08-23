const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  } catch {
    throw new ApiError("Couldn't reach the FlowPilot API. Is the server running?", 0);
  }

  if (response.status === 204) return null;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error
      ? typeof body.error === "string"
        ? body.error
        : "Request was invalid."
      : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }
  return body;
}

export const api = {
  get: (path) => request(path),
  put: (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) }),
  post: (path, data) => request(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  delete: (path) => request(path, { method: "DELETE" }),
};
