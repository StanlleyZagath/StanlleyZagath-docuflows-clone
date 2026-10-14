import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, requireEditor, visibleDocuments } from "@/lib/permissions";
import { DocumentForm } from "@/components/DocumentForm";

export default async function EditDocument({ params }: { params: { id: string } }) {
  const user = await requireUser();
  requireEditor(user);
  const doc = await db.document.findFirst({ where: { id: params.id, ...visibleDocuments(user) }, include: { questions: true } });
  if (!doc) notFound();
  if (!isAdmin(user) && doc.authorId !== user.id && user.role !== "EDITOR") notFound();
  const departments = await db.department.findMany({ where: { orgId: user.orgId }, orderBy: { name: "asc" } });
  const quiz = doc.questions
    .map((q) => `${q.text} | ${(JSON.parse(q.options) as string[]).join(" ; ")} | ${q.correct + 1}`)
    .join("\n");
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Editar documento</h1>
      <DocumentForm id={doc.id} departments={departments}
        initial={{ title: doc.title, content: doc.content, status: doc.status, departmentId: doc.departmentId, quiz }} />
    </div>
  );
}
