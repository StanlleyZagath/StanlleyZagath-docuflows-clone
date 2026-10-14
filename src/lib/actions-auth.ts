"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "./db";
import { createSession, destroySession } from "./auth";
import { DEFAULT_TEMPLATES } from "./templates";

export type FormState = { error?: string } | undefined;

const registerSchema = z.object({
  org: z.string().trim().min(2, "Informe o nome da empresa"),
  name: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
});

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { org, name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "Este e-mail já está cadastrado" };
  const user = await db.user.create({
    data: {
      name, email, role: "OWNER",
      passwordHash: await bcrypt.hash(password, 10),
      org: { create: { name: org, templates: { create: DEFAULT_TEMPLATES } } },
    },
  });
  await createSession(user.id);
  redirect("/app");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "E-mail ou senha incorretos" };
  await createSession(user.id);
  redirect("/app");
}

export async function logout() {
  destroySession();
  redirect("/");
}
