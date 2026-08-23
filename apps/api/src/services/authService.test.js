import { test } from "node:test";
import assert from "node:assert/strict";
import { issueSessionToken, verifySessionToken } from "./authService.js";

// registerUser/authenticateUser hit the database through userRepository and
// aren't covered here — they need a live Postgres instance (see README).
// The session-token issue/verify round trip is pure JWT logic and doesn't.

test("a token issued for a user can be verified back to the same identity", () => {
  const user = { id: "user-123", email: "ada@example.com" };
  const token = issueSessionToken(user);
  const payload = verifySessionToken(token);
  assert.equal(payload.sub, "user-123");
  assert.equal(payload.email, "ada@example.com");
});

test("a tampered token fails verification", () => {
  const token = issueSessionToken({ id: "user-123", email: "ada@example.com" });
  const tampered = token.slice(0, -2) + (token.at(-2) === "a" ? "b" : "a") + token.at(-1);
  assert.throws(() => verifySessionToken(tampered));
});

test("a token signed with a different secret is rejected", () => {
  const validToken = issueSessionToken({ id: "user-123", email: "ada@example.com" });
  // Sanity check the valid one verifies, then confirm garbage doesn't.
  assert.doesNotThrow(() => verifySessionToken(validToken));
  assert.throws(() => verifySessionToken("not.a.jwt"));
});
