import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./passwordService.js";

test("a hashed password never equals the plaintext", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.notEqual(hash, "correct horse battery staple");
  assert.ok(hash.startsWith("$argon2id$"));
});

test("verifyPassword accepts the correct password", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword(hash, "correct horse battery staple"), true);
});

test("verifyPassword rejects an incorrect password", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword(hash, "wrong password"), false);
});

test("hashing the same password twice produces different hashes (salted)", async () => {
  const [a, b] = await Promise.all([hashPassword("same password"), hashPassword("same password")]);
  assert.notEqual(a, b);
});
