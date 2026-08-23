import dns from "node:dns/promises";
import net from "node:net";

export class SsrfBlockedError extends Error {
  constructor(host) {
    super(`Request to "${host}" is blocked: it resolves to a private/internal network address.`);
    this.name = "SsrfBlockedError";
  }
}

/**
 * Blocks the HTTP Request node from reaching internal infrastructure.
 * Checks both the literal hostname (if it's already an IP) and, for
 * hostnames, every address DNS resolves it to — a name can legitimately
 * resolve to a private IP (DNS rebinding), so resolving is not optional.
 */
function isPrivateAddress(address, family) {
  if (family === 6) {
    const normalized = address.toLowerCase();
    if (normalized === "::1") return true; // loopback
    if (normalized.startsWith("fe80:")) return true; // link-local
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local
    return false;
  }

  const parts = address.split(".").map(Number);
  const [a, b] = parts;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // RFC1918
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 169 && b === 254) return true; // link-local / cloud metadata (169.254.169.254)
  if (a === 0) return true; // "this" network
  return false;
}

export async function assertUrlIsSafe(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed.");
  }

  const hostname = url.hostname;

  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname, net.isIP(hostname))) {
      throw new SsrfBlockedError(hostname);
    }
    return;
  }

  if (hostname === "localhost") {
    throw new SsrfBlockedError(hostname);
  }

  const records = await dns.lookup(hostname, { all: true });
  for (const record of records) {
    if (isPrivateAddress(record.address, record.family)) {
      throw new SsrfBlockedError(hostname);
    }
  }
}
