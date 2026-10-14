import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireAdmin, ROLE_LABEL } from "@/lib/permissions";
import { addMember, createDepartment, updateMember } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/Form";

export default async function TeamPage() {
  const user = await requireUser();
  requireAdmin(user);
  const [users, departments] = await Promise.all([
    db.user.findMany({ where: { orgId: user.orgId }, orderBy: { name: "asc" } }),
    db.department.findMany({ where: { orgId: user.orgId }, orderBy: { name: "asc" } }),
  ]);
  const roleOptions = ["ADMIN", "EDITOR", "MEMBER"];
  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold">Equipe</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Departamentos</h2>
        <p className="text-sm text-slate-600">{departments.map((d) => d.name).join(", ") || "Nenhum ainda."}</p>
        <form action={createDepartment} className="flex gap-2">
          <input className="input max-w-xs" name="name" placeholder="Novo departamento" required />
          <button className="btn">Adicionar</button>
        </form>
      </section>

      <section className="card p-0">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500"><th className="p-3">Nome</th><th>E-mail</th><th>Papel</th><th>Departamento</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="p-3">{u.name}</td><td>{u.email}</td>
                {u.role === "OWNER" ? (
                  <><td>{ROLE_LABEL.OWNER}</td><td>—</td><td /></>
                ) : (
                  <td colSpan={3}>
                    <form action={updateMember.bind(null, u.id)} className="flex gap-2">
                      <select name="role" defaultValue={u.role} className="input w-auto">
                        {roleOptions.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                      <select name="departmentId" defaultValue={u.departmentId ?? ""} className="input w-auto">
                        <option value="">—</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <button className="btn-secondary">Salvar</button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Adicionar membro</h2>
        <ActionForm action={addMember} className="grid gap-3 sm:grid-cols-2">
          <input className="input" name="name" placeholder="Nome" required />
          <input className="input" name="email" type="email" placeholder="E-mail" required />
          <input className="input" name="password" type="password" placeholder="Senha temporária (mín. 8)" minLength={8} required />
          <select className="input" name="role">{roleOptions.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
          <select className="input" name="departmentId"><option value="">Sem departamento</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <div><SubmitButton>Adicionar</SubmitButton></div>
        </ActionForm>
      </section>
    </div>
  );
}
