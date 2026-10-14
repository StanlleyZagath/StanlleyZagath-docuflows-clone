import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireEditor, visibleDocuments } from "@/lib/permissions";
import { savePath } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/Form";

export default async function NewPath() {
  const user = await requireUser();
  requireEditor(user);
  const [departments, docs] = await Promise.all([
    db.department.findMany({ where: { orgId: user.orgId } }),
    db.document.findMany({ where: { ...visibleDocuments(user), status: "PUBLISHED" }, orderBy: { title: "asc" } }),
  ]);
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Nova trilha</h1>
      <ActionForm action={savePath}>
        <div><label className="label" htmlFor="title">Título</label><input className="input" id="title" name="title" required /></div>
        <div><label className="label" htmlFor="description">Descrição</label><input className="input" id="description" name="description" /></div>
        <div>
          <label className="label" htmlFor="departmentId">Departamento</label>
          <select className="input" id="departmentId" name="departmentId">
            <option value="">Toda a empresa</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <fieldset className="card space-y-2">
          <legend className="label px-1">Documentos publicados (na ordem da lista)</legend>
          {docs.length === 0 && <p className="text-sm text-slate-500">Publique ao menos um documento primeiro.</p>}
          {docs.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="documentIds" value={d.id} /> {d.title}</label>
          ))}
        </fieldset>
        <SubmitButton>Criar trilha</SubmitButton>
      </ActionForm>
    </div>
  );
}
