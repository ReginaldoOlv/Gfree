# GFREE

Plataforma que conecta **freelancers** e **empresas**: vagas → candidaturas → contratação → projetos → avaliações, com notificações.

**Stack:** React 18 + TypeScript + Vite · Tailwind CSS · React Router · React Hook Form + Zod · Lucide · Supabase (PostgreSQL, Auth, RLS).

## Como rodar

```bash
npm install
cp .env.example .env        # preencha com as credenciais PÚBLICAS do seu projeto Supabase
npm run dev                 # http://localhost:5173
```

Sem `.env` configurado o app mostra uma tela de "Configuração pendente" — **nenhum dado é simulado**.

### Configurar o Supabase
1. Crie um projeto em supabase.com.
2. Em **SQL Editor**, execute **na ordem** os arquivos de `supabase/migrations/`
   (ou use `supabase db push` com a Supabase CLI):
   `…0001_schema.sql` → `…0002_functions.sql` → `…0003_rls_views.sql` → `…0004_seed_habilidades.sql`
3. Em **Project Settings → API**, copie *Project URL* e a chave **anon** para o `.env`.
   **Nunca** use a `service_role` no frontend.
4. Em **Authentication → Providers → Email**, para desenvolvimento desligue *Confirm email*
   (login automático após o cadastro). Com a confirmação ligada, o usuário é enviado ao login com aviso.
5. Em **Authentication → URL Configuration**, adicione `http://localhost:5173/redefinir-senha` às *Redirect URLs* (recuperação de senha).

### Scripts
| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | typecheck + build de produção |
| `npm test` | testes (validações + banco via PGlite/PostgreSQL real em WASM) |

## Telas
Login · Cadastro (Freelancer/Empresa) · Recuperar/Redefinir senha · **Freelancer:** Painel, Buscar vagas, Detalhes da vaga + candidatura, Minhas candidaturas · **Empresa:** Painel, Minhas vagas, Publicar/Editar vaga, Gerenciar candidaturas · **Ambos:** Projetos (+ conclusão e avaliação), Notificações · Acesso negado / 404.

## Arquitetura
```
src/
  components/ (ui/ Button, Field, StatusBadge, Stars, ConfirmModal, States…; VagaCard, CandidaturaCard, AvaliacaoPanel)
  pages/  layouts/  routes/ (ProtectedRoute)  contexts/ (Auth, Toast)
  services/ (acesso ao Supabase)  schemas/ (Zod)  lib/ (CPF/CNPJ, formatação, erros)  hooks/  types/
supabase/migrations/   esquema, funções (RPC), RLS, seed
tests/                 db.test.ts (regras de negócio no PostgreSQL) · documentos.test.ts
```

### Segurança (resumo)
- Senha: somente no Supabase Auth (bcrypt). Nada de senha nas tabelas do app.
- **Cadastro atômico:** trigger em `auth.users` cria `usuario` + `freelancer`/`empresa` (mesmo id), valida CPF/CNPJ (dígitos verificadores), grava `consentimento_lgpd` + `data_consentimento` (`now()` do servidor). Falhou um passo → o signUp inteiro é desfeito.
- **RLS em todas as tabelas.** Clientes só *leem* (tabelas/views); toda escrita de negócio passa por funções `security definer` que checam `auth.uid()`, propriedade do registro e transições de status. Autorização nunca depende de esconder botões.
- Contratação (candidatura + projeto + recusa das demais + encerramento da vaga) e envio de candidatura (+ notificação) são transações únicas. Unicidades no banco: `(id_vaga,id_freelancer)`, `projeto.id_candidatura`, `(id_projeto,id_avaliador)`.
- Avaliações independentes por RLS: quem recebe só vê a avaliação após enviar a sua.

## Decisões onde o PDF não especifica
- **Transições de candidatura:** `ENVIADA → VISUALIZADA` (automática ao abrir a proposta, ou botão) → `EM_ANALISE` → `CONTRATADA`. `RECUSADA` é permitida a partir de `VISUALIZADA` e `EM_ANALISE`. Contratar exige `EM_ANALISE`.
- **Contratar** recusa automaticamente as demais candidaturas (com notificação) e **encerra a vaga** (`ENCERRADA`, imutável).
- **Vaga:** `ATIVA ↔ EM_RISCO` (marcação manual pela empresa), `→ ARQUIVADA` (reativável) e `→ ENCERRADA` (final). Prazo de entrega é uma data.
- **Concluir projeto:** somente a empresa contratante. Status `CANCELADO` existe no modelo, mas não há ação de cancelar na interface.
- **Índice de responsividade:** % de candidaturas recebidas já respondidas (status ≠ `ENVIADA`), recalculado nas RPCs; `NULL` = "sem histórico".
- **Notificações:** `NOVA_CANDIDATURA`, `STATUS_ATUALIZADO`, `SOLICITACAO_AVALIACAO` (ao concluir) e `NOVA_AVALIACAO`; com estado lida/não lida.
- Proposta só não pode ser vazia; o valor proposto é opcional e fica `NULL` quando em branco.
- Não há função de "retirar candidatura" (fora do dicionário de dados).

## Testes executados
`npm test` → **31 testes passando**:
- 22 no PostgreSQL (PGlite) aplicando as migrações reais: cadastro válido/inválido/duplicado/sem consentimento, publicação e filtros, candidatura (inclusive duplicada e valor `NULL`), 1ª visualização sem sobrescrita, transições válidas/inválidas, contratação sem duplicidade, notificações, conclusão, avaliação única (inclusive 2 requisições simultâneas), independência das avaliações, isolamento entre usuários/empresas e contratações concorrentes.
- 9 de validações do frontend (CPF/CNPJ, schemas, formatação, mensagens de erro).

## Pendências reais
- **Não foi possível testar a interface contra um Supabase real** nem abrir em navegador neste ambiente (sem credenciais/navegador). `npm run build` e o typecheck passam; os fluxos de interface (login/redirecionamento, responsividade) precisam de uma verificação manual após configurar o `.env`.
- O comportamento de Auth (confirmação de e-mail, e-mails de recuperação) depende da configuração do seu projeto Supabase.
- Os testes de banco rodam no PGlite com um `auth` simulado; vale repetir o fluxo uma vez no Supabase real.
- Bundle único (~580 kB); code-splitting por rota é uma otimização futura.
