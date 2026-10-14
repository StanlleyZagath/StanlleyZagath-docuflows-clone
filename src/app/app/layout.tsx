import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/actions-auth";
import { canEdit, isAdmin, ROLE_LABEL } from "@/lib/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const links = [
    ["/app", "Painel"],
    ["/app/documents", "Documentos"],
    ["/app/paths", "Trilhas"],
    ...(canEdit(user) ? [["/app/templates", "Templates"]] : []),
    ...(isAdmin(user) ? [["/app/team", "Equipe"]] : []),
  ];
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white p-4 md:w-60 md:border-b-0 md:border-r">
        <p className="text-lg font-bold text-brand-700">DocuFlows</p>
        <p className="text-xs text-slate-500">{user.org.name}</p>
        <nav className="mt-4 flex gap-1 md:flex-col">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100">{label}</Link>
          ))}
        </nav>
        <div className="mt-6 text-xs text-slate-500">
          <p>{user.name}</p>
          <p>{ROLE_LABEL[user.role]}{user.department ? ` · ${user.department.name}` : ""}</p>
          <form action={logout}><button className="mt-2 underline">Sair</button></form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
