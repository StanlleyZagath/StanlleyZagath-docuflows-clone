# DocuFlows Clone

Plataforma de documentação de processos, onboarding e treinamento (inspirada em ferramentas como o DocuFlows). Next.js 14 + TypeScript + Tailwind + Prisma.

## Funcionalidades
- Cadastro de empresa (organização) e login (cookie JWT httpOnly, senhas com bcrypt)
- Papéis: Proprietário, Administrador, Editor, Membro
- Departamentos e permissões: membros só veem documentos publicados da empresa toda ou do seu departamento
- Documentos/POPs em Markdown, templates, rascunho/publicado, versão incrementada a cada mudança de conteúdo
- Rastreio de leitura por versão (editores veem quem leu e quem está desatualizado)
- Quizzes por documento (aprovação ≥ 70%)
- Trilhas de onboarding e certificados com página pública de verificação (`/certificate/<código>`)

## Rodando
```bash
npm install
cp .env.example .env   # defina AUTH_SECRET
npm run setup          # prisma generate + db push + seed
npm run dev
```
Usuários de demonstração (senha `demo12345`): `admin@demo.com` (proprietário) e `membro@demo.com`.

## Banco de dados
Usa SQLite por padrão. Para Postgres, troque `provider` em `prisma/schema.prisma` para `postgresql` e ajuste `DATABASE_URL`.

## Limitações conhecidas
- Sem criação de documentos por IA, convites por e-mail, upload de arquivos nem testes automatizados.
- Membros são criados pelo administrador com senha temporária.
