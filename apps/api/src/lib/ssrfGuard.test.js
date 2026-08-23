import { test } from "node:test";
import assert from "node:assert/strict";
import { assertUrlIsSafe, SsrfBlockedError } from "./ssrfGuard.js";

// Only literal-IP and localhost cases are tested here — anything requiring a
// real hostname would need actual DNS resolution, which makes a unit test
// flaky and network-dependent for no real gain over these direct cases.

test("rejects an invalid URL string", async () => {
  await assert.rejects(() => assertUrlIsSafe("not a url"), /Invalid URL/);
});

test("rejects a non-http(s) protocol", async () => {
  await assert.rejects(() => assertUrlIsSafe("ftp://example.com/file"), /Only http\/https/);
});

test("blocks loopback (127.0.0.1)", async () => {
  await assert.rejects(() => assertUrlIsSafe("http://127.0.0.1/admin"), SsrfBlockedError);
});

test("blocks RFC1918 10.x.x.x", async () => {
  await assert.rejects(() => assertUrlIsSafe("http://10.0.0.5/"), SsrfBlockedError);
});

test("blocks RFC1918 172.16-31.x.x", async () => {
  await assert.rejects(() => assertUrlIsSafe("http://172.20.0.1/"), SsrfBlockedError);
});

test("does not block 172.x outside the RFC1918 range", async () => {
  await assert.doesNotReject(() => assertUrlIsSafe("http://172.64.0.1/"));
});

test("blocks RFC1918 192.168.x.x", async () => {
  await assert.rejects(() => assertUrlIsSafe("http://192.168.1.1/"), SsrfBlockedError);
});

test("blocks the cloud metadata address 169.254.169.254", async () => {
  await assert.rejects(() => assertUrlIsSafe("http://169.254.169.254/latest/meta-data"), SsrfBlockedError);
});

test("blocks IPv6 loopback ::1", async () => {
  await assert.rejects(() => assertUrlIsSafe("http://[::1]/"), SsrfBlockedError);
});

test("blocks the literal hostname 'localhost'", async () => {
  await assert.rejects(() => assertUrlIsSafe("http://localhost:5432/"), SsrfBlockedError);
});

test("allows a public IP literal", async () => {
  await assert.doesNotReject(() => assertUrlIsSafe("http://93.184.216.34/"));
});
