import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEdit, isAdmin, visibleDocuments } from "@/lib/permissions";
import { deleteDocument, markRead, submitQuiz } from "@/lib/actions";
import { Markdown } from "@/lib/markdown";

export default async function DocumentPage({ params, searchParams }: { params: { id: string }; searchParams: { score?: string } }) {
  const user = await requireUser();
  const doc = await db.document.findFirst({
    where: { id: params.id, ...visibleDocuments(user) },
    include: { author: true, department: true, questions: true },
  });
  if (!doc) notFound();
  const read = await db.documentRead.findUnique({ where: { userId_documentId: { userId: user.id, documentId: doc.id } } });
  const hasRead = !!read && read.version >= doc.version;
  const passed = await db.quizAttempt.findFirst({ where: { userId: user.id, documentId: doc.id, passed: true } });

  const readership = canEdit(user)
    ? await db.user.findMany({
        where: { orgId: user.orgId, ...(doc.departmentId ? { departmentId: doc.departmentId } : {}) },
        include: { reads: { where: { documentId: doc.id } } },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{doc.title}</h1>
          <p className="text-sm text-slate-500">{doc.department?.name ?? "Toda a empresa"} · {doc.author.name} · v{doc.version} · {doc.status === "DRAFT" ? "Rascunho" : "Publicado"}</p>
        </div>
        {canEdit(user) && (
          <div className="flex gap-2">
            <Link className="btn-secondary" href={`/app/documents/${doc.id}/edit`}>Editar</Link>
            {(isAdmin(user) || doc.authorId === user.id) && (
              <form action={deleteDocument.bind(null, doc.id)}><button className="btn-secondary text-red-700">Excluir</button></form>
            )}
          </div>
        )}
      </div>

      <article className="card"><Markdown source={doc.content} /></article>

      {doc.status === "PUBLISHED" && (
        <div className="card flex items-center justify-between">
          {hasRead ? <p className="text-sm text-green-700">✓ Você leu a versão {doc.version}.</p> : (
            <>
              <p className="text-sm text-slate-600">Confirme que leu e entendeu este documento.</p>
              <form action={markRead.bind(null, doc.id)}><button className="btn">Marcar como lido</button></form>
            </>
          )}
        </div>
      )}

      {doc.status === "PUBLISHED" && doc.questions.length > 0 && (
        <section className="card space-y-4">
          <h2 className="font-semibold">Quiz</h2>
          {searchParams.score && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm">Última nota: {searchParams.score}% (aprovação: 70%)</p>}
          {passed && <p className="text-sm text-green-700">✓ Aprovado.</p>}
          <form action={submitQuiz.bind(null, doc.id)} className="space-y-4">
            {doc.questions.map((q, i) => (
              <fieldset key={q.id} className="space-y-1">
                <legend className="text-sm font-medium">{i + 1}. {q.text}</legend>
                {(JSON.parse(q.options) as string[]).map((o, j) => (
                  <label key={j} className="flex items-center gap-2 text-sm">
                    <input type="radio" name={`q_${q.id}`} value={j} required /> {o}
                  </label>
                ))}
              </fieldset>
            ))}
            <button className="btn">Enviar respostas</button>
          </form>
        </section>
      )}

      {canEdit(user) && doc.status === "PUBLISHED" && (
        <section className="card">
          <h2 className="mb-2 font-semibold">Rastreio de leitura</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th className="py-1">Pessoa</th><th>Situação</th></tr></thead>
            <tbody>
              {readership.map((u) => {
                const r = u.reads[0];
                return (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="py-1">{u.name}</td>
                    <td>{!r ? "Não leu" : r.version >= doc.version ? `Leu v${r.version} em ${r.readAt.toLocaleDateString("pt-BR")}` : `Leu v${r.version} (desatualizado)`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
