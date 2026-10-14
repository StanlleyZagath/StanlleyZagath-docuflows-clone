import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireEditor } from "@/lib/permissions";
import { DocumentForm } from "@/components/DocumentForm";

export default async function NewDocument({ searchParams }: { searchParams: { template?: string } }) {
  const user = await requireUser();
  requireEditor(user);
  const [departments, templates] = await Promise.all([
    db.department.findMany({ where: { orgId: user.orgId }, orderBy: { name: "asc" } }),
    db.template.findMany({ where: { orgId: user.orgId } }),
  ]);
  const tpl = templates.find((t) => t.id === searchParams.template);
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Novo documento</h1>
      <DocumentForm
        key={tpl?.id ?? "blank"} id={null} departments={departments} templates={templates}
        initial={{ title: tpl?.title ?? "", content: tpl?.content ?? "", status: "DRAFT", departmentId: null, quiz: "" }}
      />
    </div>
  );
}
