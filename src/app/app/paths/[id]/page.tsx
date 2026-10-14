import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEdit, visiblePaths } from "@/lib/permissions";
import { claimCertificate, deletePath } from "@/lib/actions";

export default async function PathPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const path = await db.path.findFirst({
    where: { id: params.id, ...visiblePaths(user) },
    include: { items: { orderBy: { position: "asc" }, include: { document: { include: { questions: true } } } } },
  });
  if (!path) notFound();

  const rows = await Promise.all(path.items.map(async ({ document: d }) => {
    const read = await db.documentRead.findUnique({ where: { userId_documentId: { userId: user.id, documentId: d.id } } });
    const quizOk = d.questions.length === 0 || !!(await db.quizAttempt.findFirst({ where: { userId: user.id, documentId: d.id, passed: true } }));
    return { d, done: !!read && read.version >= d.version && quizOk, read: !!read && read.version >= d.version, quizOk, hasQuiz: d.questions.length > 0 };
  }));
  const complete = rows.length > 0 && rows.every((r) => r.done);
  const cert = await db.certificate.findUnique({ where: { userId_pathId: { userId: user.id, pathId: path.id } } });

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold">{path.title}</h1><p className="text-slate-600">{path.description}</p></div>
        {canEdit(user) && <form action={deletePath.bind(null, path.id)}><button className="btn-secondary text-red-700">Excluir</button></form>}
      </div>
      <ol className="card divide-y divide-slate-100 p-0">
        {rows.map(({ d, done, read, hasQuiz, quizOk }, i) => (
          <li key={d.id}>
            <Link className="flex items-center justify-between px-5 py-3 hover:bg-slate-50" href={`/app/documents/${d.id}`}>
              <span>{i + 1}. {d.title}</span>
              <span className="text-xs text-slate-500">{done ? "✓ Concluído" : `${read ? "Lido" : "Não lido"}${hasQuiz ? ` · quiz ${quizOk ? "aprovado" : "pendente"}` : ""}`}</span>
            </Link>
          </li>
        ))}
      </ol>
      {cert ? (
        <Link className="btn" href={`/certificate/${cert.code}`}>Ver certificado</Link>
      ) : complete ? (
        <form action={claimCertificate.bind(null, path.id)}><button className="btn">Emitir certificado</button></form>
      ) : (
        <p className="text-sm text-slate-500">Conclua todos os documentos e quizzes para emitir o certificado.</p>
      )}
    </div>
  );
}
