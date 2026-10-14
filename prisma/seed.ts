import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_TEMPLATES } from "../src/lib/templates";

const db = new PrismaClient();

async function main() {
  if (await db.user.findUnique({ where: { email: "admin@demo.com" } })) return console.log("Seed já aplicado.");
  const hash = await bcrypt.hash("demo12345", 10);
  const org = await db.organization.create({
    data: { name: "Empresa Demo", templates: { create: DEFAULT_TEMPLATES }, departments: { create: [{ name: "Vendas" }, { name: "Suporte" }] } },
    include: { departments: true },
  });
  const sales = org.departments.find((d) => d.name === "Vendas")!;
  const admin = await db.user.create({ data: { email: "admin@demo.com", name: "Ana Admin", role: "OWNER", passwordHash: hash, orgId: org.id } });
  await db.user.create({ data: { email: "membro@demo.com", name: "Marcos Membro", role: "MEMBER", passwordHash: hash, orgId: org.id, departmentId: sales.id } });
  const doc = await db.document.create({
    data: {
      title: "Política de atendimento", status: "PUBLISHED", orgId: org.id, authorId: admin.id,
      content: "# Atendimento\nResponder todo cliente em até **24 horas**.\n\n- Seja cordial\n- Registre o contato",
      questions: { create: [{ text: "Qual o prazo de resposta?", options: JSON.stringify(["12h", "24h", "72h"]), correct: 1 }] },
    },
  });
  await db.path.create({
    data: { title: "Onboarding geral", description: "Primeiros passos na empresa", orgId: org.id, items: { create: [{ documentId: doc.id, position: 0 }] } },
  });
  console.log("Seed ok: admin@demo.com / membro@demo.com — senha demo12345");
}
main().finally(() => db.$disconnect());
