"use client";
import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/lib/actions-auth";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Aguarde…" : children}</button>;
}

/** Formulário ligado a uma server action que devolve { error }. */
export function ActionForm({
  action, children, className,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className={className ?? "space-y-4"}>
      {children}
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
