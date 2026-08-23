import { openDB } from "idb";

const DB_NAME = "flowpilot";
const DB_VERSION = 1;

let dbPromise;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const workflows = db.createObjectStore("workflows", { keyPath: "id" });
        workflows.createIndex("updatedAt", "updatedAt");

        db.createObjectStore("preferences", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

export async function listWorkflows() {
  const db = await getDb();
  const all = await db.getAll("workflows");
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getWorkflow(id) {
  const db = await getDb();
  const record = await db.get("workflows", id);
  // TanStack Query rejects `undefined` from a queryFn — `null` is the
  // correct "not found" value.
  return record ?? null;
}

export async function putWorkflow(workflow) {
  const db = await getDb();
  await db.put("workflows", workflow);
  return workflow;
}

export async function deleteWorkflow(id) {
  const db = await getDb();
  await db.delete("workflows", id);
}

export async function getPreference(key, fallback) {
  const db = await getDb();
  const record = await db.get("preferences", key);
  return record ? record.value : fallback;
}

export async function setPreference(key, value) {
  const db = await getDb();
  await db.put("preferences", { key, value });
}
