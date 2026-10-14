import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export default async function CertificatePage({ params }: { params: { code: string } }) {
  const cert = await db.certificate.findUnique({
    where: { code: params.code },
    include: { user: { include: { org: true } }, path: true },
  });
  if (!cert) notFound();
  return (
    <main className="mx-auto mt-16 max-w-2xl px-4">
      <div className="rounded-2xl border-4 border-double border-brand-500 bg-white p-10 text-center shadow">
        <p className="text-sm uppercase tracking-widest text-slate-500">Certificado de conclusão</p>
        <h1 className="mt-6 text-3xl font-bold">{cert.user.name}</h1>
        <p className="mt-4 text-slate-600">concluiu a trilha</p>
        <p className="mt-1 text-xl font-semibold text-brand-700">{cert.path.title}</p>
        <p className="mt-6 text-sm text-slate-500">{cert.user.org.name} · {cert.issuedAt.toLocaleDateString("pt-BR")}</p>
        <p className="mt-6 text-xs text-slate-400">Código de verificação: {cert.code}</p>
      </div>
    </main>
  );
}
