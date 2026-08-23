import { registerSchema, loginSchema } from "../validators/authValidators.js";
import {
  registerUser,
  authenticateUser,
  issueSessionToken,
  AuthError,
} from "../services/authService.js";

const SESSION_COOKIE = "flowpilot_session";
const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  // In dev, frontend and backend are both localhost (different ports, same
  // registrable domain) — "lax" works fine. In production, the frontend
  // (Netlify) and backend (Fly.io) are genuinely different sites, and a
  // cross-site fetch() with credentials will NOT include a "lax" cookie at
  // all — only "none" (which requires "secure") is sent on cross-site
  // subrequests. Getting this wrong means auth silently never works once
  // actually deployed to two different domains.
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function register(request, reply) {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }
  try {
    const user = await registerUser(parsed.data);
    const token = issueSessionToken(user);
    reply.setCookie(SESSION_COOKIE, token, COOKIE_OPTIONS);
    return reply.code(201).send({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      return reply.code(409).send({ error: error.message });
    }
    throw error;
  }
}

export async function login(request, reply) {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }
  try {
    const user = await authenticateUser(parsed.data);
    const token = issueSessionToken(user);
    reply.setCookie(SESSION_COOKIE, token, COOKIE_OPTIONS);
    return reply.send({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      return reply.code(401).send({ error: error.message });
    }
    throw error;
  }
}

export async function logout(request, reply) {
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
  return reply.code(204).send();
}

export { SESSION_COOKIE };
