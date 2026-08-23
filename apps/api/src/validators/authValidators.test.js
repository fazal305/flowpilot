import { test } from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema } from "./authValidators.js";

test("a valid registration payload passes", () => {
  const result = registerSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "correct-horse" });
  assert.equal(result.success, true);
});

test("registration rejects an invalid email", () => {
  const result = registerSchema.safeParse({ name: "Ada", email: "not-an-email", password: "correct-horse" });
  assert.equal(result.success, false);
});

test("registration rejects a too-short password", () => {
  const result = registerSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "short" });
  assert.equal(result.success, false);
});

test("registration rejects an empty name", () => {
  const result = registerSchema.safeParse({ name: "", email: "ada@example.com", password: "correct-horse" });
  assert.equal(result.success, false);
});

test("login only requires a well-formed email and a non-empty password", () => {
  assert.equal(loginSchema.safeParse({ email: "ada@example.com", password: "x" }).success, true);
  assert.equal(loginSchema.safeParse({ email: "ada@example.com", password: "" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "bad", password: "x" }).success, false);
});
