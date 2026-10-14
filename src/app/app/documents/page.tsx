import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEdit, visibleDocuments } from "@/lib/permissions";

export default async function DocumentsPage() {
  const user = await requireUser();
  const docs = await db.document.findMany({
    where: visibleDocuments(user), orderBy: { updatedAt: "desc" },
    include: { department: true, author: true },
  });
  const reads = await db.documentRead.findMany({ where: { userId: user.id } });
  const readMap = new Map(reads.map((r) => [r.documentId, r.version]));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documentos</h1>
        {canEdit(user) && <Link className="btn" href="/app/documents/new">Novo documento</Link>}
      </div>
      {docs.length === 0 ? <p className="text-slate-500">Nenhum documento ainda.</p> : (
        <ul className="card divide-y divide-slate-100 p-0">
          {docs.map((d) => {
            const read = (readMap.get(d.id) ?? 0) >= d.version;
            return (
              <li key={d.id}>
                <Link className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50" href={`/app/documents/${d.id}`}>
                  <span>
                    <span className="font-medium">{d.title}</span>
                    <span className="block text-xs text-slate-500">{d.department?.name ?? "Toda a empresa"} · {d.author.name} · v{d.version}</span>
                  </span>
                  <span className="flex gap-2 text-xs">
                    {d.status === "DRAFT" && <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">Rascunho</span>}
                    {d.status === "PUBLISHED" && (read
                      ? <span className="rounded bg-green-100 px-2 py-0.5 text-green-800">Lido</span>
                      : <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">Não lido</span>)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
