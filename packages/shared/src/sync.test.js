import { test } from "node:test";
import assert from "node:assert/strict";
import { decideSyncAction } from "./sync.js";

test("no changes on either side needs no action", () => {
  assert.equal(decideSyncAction({ localVersion: 3, baseVersion: 3, serverVersion: 3 }), "none");
});

test("only local changed needs a push", () => {
  assert.equal(decideSyncAction({ localVersion: 4, baseVersion: 3, serverVersion: 3 }), "push");
});

test("only server changed needs a pull", () => {
  assert.equal(decideSyncAction({ localVersion: 3, baseVersion: 3, serverVersion: 4 }), "pull");
});

test("both sides changed since the common base is a conflict", () => {
  assert.equal(decideSyncAction({ localVersion: 4, baseVersion: 3, serverVersion: 5 }), "conflict");
});
