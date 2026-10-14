import { redirect } from "next/navigation";
import type { SessionUser } from "./auth";

export const ROLES = ["OWNER", "ADMIN", "EDITOR", "MEMBER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  EDITOR: "Editor",
  MEMBER: "Membro",
};

export const isAdmin = (u: { role: string }) => u.role === "OWNER" || u.role === "ADMIN";
export const canEdit = (u: { role: string }) => isAdmin(u) || u.role === "EDITOR";

export function requireEditor(u: SessionUser) {
  if (!canEdit(u)) redirect("/app");
}
export function requireAdmin(u: SessionUser) {
  if (!isAdmin(u)) redirect("/app");
}

/** Prisma `where` limitando o que o usuário pode ver (isolamento por organização e departamento). */
export function visibleDocuments(u: SessionUser) {
  const base = { orgId: u.orgId };
  if (canEdit(u)) {
    return isAdmin(u)
      ? base
      : { ...base, OR: [{ departmentId: null }, { departmentId: u.departmentId }, { authorId: u.id }] };
  }
  return {
    ...base,
    status: "PUBLISHED",
    OR: [{ departmentId: null }, { departmentId: u.departmentId }],
  };
}

export function visiblePaths(u: SessionUser) {
  if (isAdmin(u)) return { orgId: u.orgId };
  return { orgId: u.orgId, OR: [{ departmentId: null }, { departmentId: u.departmentId }] };
}
