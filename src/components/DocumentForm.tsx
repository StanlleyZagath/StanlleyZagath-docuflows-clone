import { saveDocument } from "@/lib/actions";
import { ActionForm, SubmitButton } from "./Form";

type Props = {
  id: string | null;
  departments: { id: string; name: string }[];
  initial?: { title: string; content: string; status: string; departmentId: string | null; quiz: string };
  templates?: { id: string; title: string; content: string }[];
};

export function DocumentForm({ id, departments, initial, templates }: Props) {
  const action = saveDocument.bind(null, id);
  return (
    <ActionForm action={action}>
      {templates && templates.length > 0 && (
        <p className="text-sm text-slate-600">
          Começar de um template:{" "}
          {templates.map((t) => (
            <a key={t.id} className="mr-2 text-brand-600 underline" href={`?template=${t.id}`}>{t.title}</a>
          ))}
        </p>
      )}
      <div><label className="label" htmlFor="title">Título</label><input className="input" id="title" name="title" defaultValue={initial?.title} required /></div>
      <div>
        <label className="label" htmlFor="content">Conteúdo (Markdown: #, listas, **negrito**)</label>
        <textarea className="input h-72 font-mono" id="content" name="content" defaultValue={initial?.content} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="departmentId">Departamento</label>
          <select className="input" id="departmentId" name="departmentId" defaultValue={initial?.departmentId ?? ""}>
            <option value="">Toda a empresa</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select className="input" id="status" name="status" defaultValue={initial?.status ?? "DRAFT"}>
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="quiz">Quiz (opcional) — uma pergunta por linha</label>
        <textarea className="input h-24 font-mono" id="quiz" name="quiz" defaultValue={initial?.quiz}
          placeholder="Qual o prazo? | 24h ; 48h ; 72h | 2" />
        <p className="mt-1 text-xs text-slate-500">Formato: Pergunta | opção A ; opção B ; … | número da opção correta</p>
      </div>
      <SubmitButton>Salvar</SubmitButton>
    </ActionForm>
  );
}
