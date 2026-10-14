import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireEditor } from "@/lib/permissions";
import { saveTemplate } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/Form";

export default async function TemplatesPage() {
  const user = await requireUser();
  requireEditor(user);
  const templates = await db.template.findMany({ where: { orgId: user.orgId } });
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Templates</h1>
      <ul className="space-y-2">
        {templates.map((t) => <li key={t.id} className="card py-3"><p className="font-medium">{t.title}</p></li>)}
      </ul>
      <section>
        <h2 className="mb-2 font-semibold">Novo template</h2>
        <ActionForm action={saveTemplate}>
          <input className="input" name="title" placeholder="Título" required />
          <textarea className="input h-40 font-mono" name="content" placeholder="Conteúdo em Markdown" required />
          <SubmitButton>Salvar template</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
