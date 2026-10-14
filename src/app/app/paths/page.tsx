import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEdit, visiblePaths } from "@/lib/permissions";

export default async function PathsPage() {
  const user = await requireUser();
  const paths = await db.path.findMany({ where: visiblePaths(user), include: { items: true, department: true } });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trilhas de onboarding</h1>
        {canEdit(user) && <Link className="btn" href="/app/paths/new">Nova trilha</Link>}
      </div>
      {paths.length === 0 ? <p className="text-slate-500">Nenhuma trilha disponível.</p> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {paths.map((p) => (
            <Link key={p.id} href={`/app/paths/${p.id}`} className="card hover:border-brand-500">
              <h2 className="font-semibold">{p.title}</h2>
              <p className="text-sm text-slate-600">{p.description}</p>
              <p className="mt-2 text-xs text-slate-500">{p.items.length} documentos · {p.department?.name ?? "Toda a empresa"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
