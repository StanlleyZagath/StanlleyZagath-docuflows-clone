import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { visibleDocuments, visiblePaths } from "@/lib/permissions";

export default async function Dashboard() {
  const user = await requireUser();
  const docs = await db.document.findMany({ where: { ...visibleDocuments(user), status: "PUBLISHED" }, orderBy: { updatedAt: "desc" } });
  const reads = await db.documentRead.findMany({ where: { userId: user.id } });
  const readMap = new Map(reads.map((r) => [r.documentId, r.version]));
  const pending = docs.filter((d) => (readMap.get(d.id) ?? 0) < d.version);
  const paths = await db.path.findMany({ where: visiblePaths(user), include: { items: true } });
  const certs = await db.certificate.count({ where: { userId: user.id } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Olá, {user.name.split(" ")[0]}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-3xl font-bold">{pending.length}</p><p className="text-sm text-slate-600">documentos para ler</p></div>
        <div className="card"><p className="text-3xl font-bold">{paths.length}</p><p className="text-sm text-slate-600">trilhas disponíveis</p></div>
        <div className="card"><p className="text-3xl font-bold">{certs}</p><p className="text-sm text-slate-600">certificados</p></div>
      </div>
      <section>
        <h2 className="mb-2 font-semibold">Pendentes de leitura</h2>
        {pending.length === 0 ? <p className="text-sm text-slate-500">Tudo em dia.</p> : (
          <ul className="card divide-y divide-slate-100 p-0">
            {pending.slice(0, 8).map((d) => (
              <li key={d.id}><Link className="flex justify-between px-5 py-3 text-sm hover:bg-slate-50" href={`/app/documents/${d.id}`}><span>{d.title}</span><span className="text-slate-400">v{d.version}</span></Link></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
