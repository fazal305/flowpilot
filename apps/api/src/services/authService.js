import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { hashPassword, verifyPassword } from "./passwordService.js";
import {
  createUser,
  findUserByEmail,
} from "../repositories/userRepository.js";

const SESSION_TTL = "7d";

export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthError";
  }
}

export async function registerUser({ name, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AuthError("An account with this email already exists.");
  }
  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash });
  return toPublicUser(user);
}

export async function authenticateUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AuthError("Invalid email or password.");
  }
  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    throw new AuthError("Invalid email or password.");
  }
  return toPublicUser(user);
}

export function issueSessionToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: SESSION_TTL,
  });
}

export function verifySessionToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}
