"use server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "./db";
import { requireUser } from "./auth";
import { canEdit, isAdmin, ROLES, visibleDocuments, visiblePaths } from "./permissions";
import type { FormState } from "./actions-auth";

const emptyToNull = (v: FormDataEntryValue | null) => (v ? String(v) : null);

async function validDepartment(orgId: string, id: string | null) {
  if (!id) return null;
  const d = await db.department.findFirst({ where: { id, orgId } });
  return d ? d.id : null;
}

// ---------- Documentos ----------
const docSchema = z.object({
  title: z.string().trim().min(2, "Informe um título"),
  content: z.string().trim().min(1, "O conteúdo não pode ficar vazio"),
});

export async function saveDocument(id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!canEdit(user)) return { error: "Sem permissão" };
  const parsed = docSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const departmentId = await validDepartment(user.orgId, emptyToNull(fd.get("departmentId")));
  const status = fd.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  let docId = id;
  if (id) {
    const existing = await db.document.findFirst({ where: { id, ...visibleDocuments(user) } });
    if (!existing) return { error: "Documento não encontrado" };
    const changed = existing.content !== parsed.data.content;
    await db.document.update({
      where: { id },
      data: { ...parsed.data, departmentId, status, version: changed ? existing.version + 1 : existing.version },
    });
  } else {
    const doc = await db.document.create({
      data: { ...parsed.data, departmentId, status, orgId: user.orgId, authorId: user.id },
    });
    docId = doc.id;
  }

  // Perguntas do quiz: linhas "Pergunta | opção A ; opção B ; opção C | índice correto (1..n)"
  const quiz = String(fd.get("quiz") ?? "").trim();
  await db.question.deleteMany({ where: { documentId: docId! } });
  for (const line of quiz.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const [text, opts, correct] = line.split("|").map((s) => s.trim());
    const options = (opts ?? "").split(";").map((s) => s.trim()).filter(Boolean);
    const idx = Number(correct) - 1;
    if (!text || options.length < 2 || !Number.isInteger(idx) || idx < 0 || idx >= options.length)
      return { error: `Pergunta inválida: "${line}". Use: Pergunta | opção A ; opção B | número da correta` };
    await db.question.create({ data: { documentId: docId!, text, options: JSON.stringify(options), correct: idx } });
  }
  revalidatePath("/app", "layout");
  redirect(`/app/documents/${docId}`);
}

export async function deleteDocument(id: string) {
  const user = await requireUser();
  if (!canEdit(user)) return;
  const doc = await db.document.findFirst({ where: { id, ...visibleDocuments(user) } });
  if (!doc || (!isAdmin(user) && doc.authorId !== user.id)) return;
  await db.document.delete({ where: { id } });
  revalidatePath("/app", "layout");
  redirect("/app/documents");
}

export async function markRead(documentId: string) {
  const user = await requireUser();
  const doc = await db.document.findFirst({ where: { id: documentId, ...visibleDocuments(user) } });
  if (!doc) return;
  await db.documentRead.upsert({
    where: { userId_documentId: { userId: user.id, documentId } },
    create: { userId: user.id, documentId, version: doc.version },
    update: { version: doc.version, readAt: new Date() },
  });
  revalidatePath("/app", "layout");
}

export async function submitQuiz(documentId: string, fd: FormData) {
  const user = await requireUser();
  const doc = await db.document.findFirst({ where: { id: documentId, ...visibleDocuments(user) }, include: { questions: true } });
  if (!doc || doc.questions.length === 0) return;
  let right = 0;
  for (const q of doc.questions) if (Number(fd.get(`q_${q.id}`)) === q.correct) right++;
  const score = Math.round((right / doc.questions.length) * 100);
  await db.quizAttempt.create({ data: { userId: user.id, documentId, score, passed: score >= 70 } });
  revalidatePath("/app", "layout");
  redirect(`/app/documents/${documentId}?score=${score}`);
}

// ---------- Trilhas de onboarding ----------
export async function savePath(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!canEdit(user)) return { error: "Sem permissão" };
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 2) return { error: "Informe um título" };
  const departmentId = await validDepartment(user.orgId, emptyToNull(fd.get("departmentId")));
  const ids = fd.getAll("documentIds").map(String);
  const docs = await db.document.findMany({ where: { id: { in: ids }, orgId: user.orgId, status: "PUBLISHED" }, select: { id: true } });
  const valid = new Set(docs.map((d) => d.id));
  const ordered = ids.filter((i) => valid.has(i));
  if (ordered.length === 0) return { error: "Selecione ao menos um documento publicado" };
  const path = await db.path.create({
    data: {
      title, description: String(fd.get("description") ?? "").trim(), orgId: user.orgId, departmentId,
      items: { create: ordered.map((documentId, position) => ({ documentId, position })) },
    },
  });
  revalidatePath("/app", "layout");
  redirect(`/app/paths/${path.id}`);
}

export async function deletePath(id: string) {
  const user = await requireUser();
  if (!canEdit(user)) return;
  await db.path.deleteMany({ where: { id, orgId: user.orgId } });
  revalidatePath("/app", "layout");
  redirect("/app/paths");
}

/** Emite o certificado quando todos os documentos da trilha foram lidos e os quizzes aprovados. */
export async function claimCertificate(pathId: string) {
  const user = await requireUser();
  const path = await db.path.findFirst({
    where: { id: pathId, ...visiblePaths(user) },
    include: { items: { include: { document: { include: { questions: true } } } } },
  });
  if (!path) return;
  for (const { document } of path.items) {
    const read = await db.documentRead.findUnique({ where: { userId_documentId: { userId: user.id, documentId: document.id } } });
    if (!read || read.version < document.version) return;
    if (document.questions.length > 0) {
      const ok = await db.quizAttempt.findFirst({ where: { userId: user.id, documentId: document.id, passed: true } });
      if (!ok) return;
    }
  }
  await db.certificate.upsert({
    where: { userId_pathId: { userId: user.id, pathId } },
    create: { userId: user.id, pathId, code: randomBytes(8).toString("hex").toUpperCase() },
    update: {},
  });
  revalidatePath(`/app/paths/${pathId}`);
}

// ---------- Equipe ----------
export async function createDepartment(fd: FormData) {
  const user = await requireUser();
  if (!isAdmin(user)) return;
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return;
  await db.department.upsert({
    where: { orgId_name: { orgId: user.orgId, name } }, create: { orgId: user.orgId, name }, update: {},
  });
  revalidatePath("/app/team");
}

export async function addMember(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!isAdmin(user)) return { error: "Sem permissão" };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const name = String(fd.get("name") ?? "").trim();
  const role = String(fd.get("role") ?? "MEMBER");
  const password = String(fd.get("password") ?? "");
  if (!z.string().email().safeParse(email).success || name.length < 2) return { error: "Informe nome e e-mail válidos" };
  if (password.length < 8) return { error: "Senha temporária com ao menos 8 caracteres" };
  if (!ROLES.includes(role as never) || role === "OWNER") return { error: "Papel inválido" };
  if (await db.user.findUnique({ where: { email } })) return { error: "E-mail já cadastrado" };
  const departmentId = await validDepartment(user.orgId, emptyToNull(fd.get("departmentId")));
  await db.user.create({
    data: { email, name, role, departmentId, orgId: user.orgId, passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/app/team");
}

export async function updateMember(userId: string, fd: FormData) {
  const user = await requireUser();
  if (!isAdmin(user)) return;
  const target = await db.user.findFirst({ where: { id: userId, orgId: user.orgId } });
  if (!target || target.role === "OWNER") return;
  const role = String(fd.get("role") ?? target.role);
  if (!ROLES.includes(role as never) || role === "OWNER") return;
  const departmentId = await validDepartment(user.orgId, emptyToNull(fd.get("departmentId")));
  await db.user.update({ where: { id: userId }, data: { role, departmentId } });
  revalidatePath("/app/team");
}

// ---------- Templates ----------
export async function saveTemplate(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!canEdit(user)) return { error: "Sem permissão" };
  const title = String(fd.get("title") ?? "").trim();
  const content = String(fd.get("content") ?? "").trim();
  if (title.length < 2 || !content) return { error: "Informe título e conteúdo" };
  await db.template.create({ data: { title, content, orgId: user.orgId } });
  revalidatePath("/app/templates");
}
