import Link from "next/link";
import { login } from "@/lib/actions-auth";
import { ActionForm, SubmitButton } from "@/components/Form";

export default function LoginPage() {
  return (
    <main className="mx-auto mt-20 max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-bold">Entrar</h1>
      <ActionForm action={login} className="card space-y-4">
        <div><label className="label" htmlFor="email">E-mail</label><input className="input" id="email" name="email" type="email" required /></div>
        <div><label className="label" htmlFor="password">Senha</label><input className="input" id="password" name="password" type="password" required /></div>
        <SubmitButton>Entrar</SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-sm text-slate-600">Sem conta? <Link className="text-brand-600 underline" href="/register">Cadastre sua empresa</Link></p>
    </main>
  );
}
