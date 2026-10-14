import Link from "next/link";
import { register } from "@/lib/actions-auth";
import { ActionForm, SubmitButton } from "@/components/Form";

export default function RegisterPage() {
  return (
    <main className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-bold">Criar conta</h1>
      <ActionForm action={register} className="card space-y-4">
        <div><label className="label" htmlFor="org">Empresa</label><input className="input" id="org" name="org" required /></div>
        <div><label className="label" htmlFor="name">Seu nome</label><input className="input" id="name" name="name" required /></div>
        <div><label className="label" htmlFor="email">E-mail</label><input className="input" id="email" name="email" type="email" required /></div>
        <div><label className="label" htmlFor="password">Senha (mín. 8)</label><input className="input" id="password" name="password" type="password" minLength={8} required /></div>
        <SubmitButton>Criar conta</SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-sm text-slate-600">Já tem conta? <Link className="text-brand-600 underline" href="/login">Entrar</Link></p>
    </main>
  );
}
