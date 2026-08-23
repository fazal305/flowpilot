import { prisma } from "../db/prisma.js";

const DEFAULT_WORKSPACE_SLUG = "default";

let cachedDefaultWorkspaceId = null;

/**
 * FlowPilot doesn't have multi-tenant auth wired into the frontend yet
 * (login is UI-only until real accounts matter for this portfolio project).
 * Every workflow is written against one lazily-created default workspace so
 * the execution engine has something real to persist against now, without
 * blocking Phase 4 on building full workspace switching UI.
 */
export async function getDefaultWorkspaceId() {
  if (cachedDefaultWorkspaceId) return cachedDefaultWorkspaceId;

  const existing = await prisma.workspace.findUnique({
    where: { slug: DEFAULT_WORKSPACE_SLUG },
  });
  if (existing) {
    cachedDefaultWorkspaceId = existing.id;
    return existing.id;
  }

  const created = await prisma.workspace.create({
    data: { name: "Default Workspace", slug: DEFAULT_WORKSPACE_SLUG },
  });
  cachedDefaultWorkspaceId = created.id;
  return created.id;
}
