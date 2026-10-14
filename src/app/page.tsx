import Link from "next/link";
import { getUser } from "@/lib/auth";

const features = [
  ["Documentos e POPs", "Editor com templates, versões e controle de rascunho/publicação."],
  ["Trilhas de onboarding", "Sequências de documentos por departamento para novos colaboradores."],
  ["Quizzes e certificados", "Valide o aprendizado e emita certificados verificáveis."],
  ["Rastreio de leitura", "Saiba quem leu cada versão de cada documento."],
  ["Permissões por departamento", "Cada pessoa vê só o que é relevante para sua área."],
  ["Papéis", "Proprietário, administrador, editor e membro."],
];

export default async function Home() {
  const user = await getUser();
  return (
    <main>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="text-lg font-bold text-brand-700">DocuFlows</span>
        <nav className="flex gap-3">
          {user ? (
            <Link className="btn" href="/app">Abrir painel</Link>
          ) : (
            <>
              <Link className="btn-secondary" href="/login">Entrar</Link>
              <Link className="btn" href="/register">Começar grátis</Link>
            </>
          )}
        </nav>
      </header>
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Todo o conhecimento da sua empresa, organizado e treinado.</h1>
        <p className="mt-5 text-lg text-slate-600">Documente processos, monte trilhas de onboarding e comprove que a equipe leu e entendeu.</p>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([t, d]) => (
          <div key={t} className="card"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div>
        ))}
      </section>
    </main>
  );
}
