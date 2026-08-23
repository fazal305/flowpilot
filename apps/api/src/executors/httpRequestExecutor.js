import { assertUrlIsSafe } from "../lib/ssrfGuard.js";
import { renderTemplate } from "../lib/template.js";

function buildAuthHeaders(auth) {
  if (!auth || auth.type === "none") return {};
  if (auth.type === "bearer") return { Authorization: `Bearer ${auth.token}` };
  if (auth.type === "basic") {
    const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
    return { Authorization: `Basic ${encoded}` };
  }
  return {};
}

export async function executeHttpRequest(config, input) {
  const url = renderTemplate(config.url, input);
  await assertUrlIsSafe(url);

  const controller = new AbortController();
  const timeoutMs = config.timeoutMs ?? 10_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: config.method,
      headers: { ...config.headers, ...buildAuthHeaders(config.auth) },
      body: ["GET", "DELETE"].includes(config.method)
        ? undefined
        : renderTemplate(config.body ?? "", input),
      redirect: "manual", // don't blindly follow redirects — a 3xx to an internal address is a classic SSRF bypass
      signal: controller.signal,
    });

    if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
      throw new Error("HTTP Request node does not follow redirects (SSRF protection).");
    }

    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${typeof body === "string" ? body.slice(0, 300) : JSON.stringify(body).slice(0, 300)}`);
    }

    return { status: response.status, body };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
