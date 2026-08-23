# ROADMAP: SGE - SISTEMA DE GESTÃO DE ESTÁGIOS

> **Status:** Manutenção & Evolução (Fase 11 - Entregabilidade de E-mail & Cadastro Alternativo)
> **Baseado em:** `PROJECT_DNA.md` v1.0

Este documento define a estratégia de entrega incremental do SGE. Cada fase desbloqueia valor tangível e valida riscos técnicos antecipadamente.

---

## FASE 0: FOUNDATION (Bootstrap & Infra)

**Objetivo:** Estabelecer a infraestrutura "Zero Cost" na Vercel + Supabase e garantir um DX (Developer Experience) sólido.

- [ ] **Scaffold do Projeto:** Next.js 14, TypeScript 5, TailwindCSS.
- [ ] **Component Library:** Instalar `shadcn/ui` base (Button, Card, Input, Label, Toast).
- [ ] **Database Setup:** Inicializar projeto no Supabase e conectar via conexão pooling.
- [ ] **ORM Setup:** Configurar Prisma e criar primeira migration (`User` table).
- [ ] **CI/CD:** Pipeline básico conectada ao GitHub -> Vercel Deployment.
- [ ] **Infra Check:** Validar conexão Supabase -> Vercel para evitar "Cold Start" (Lição Aprendida: Implementar Ping/Retry se necessário).

**DoD (Definition of Done):** "Hello World" rodando na Vercel com banco conectado e componentes de UI básicos renderizando sem erros de hidratação.

---

## FASE 1: MODELAGEM & SEGURANÇA (The Backbone)

**Objetivo:** Definir a estrutura de dados relacional e o sistema de controle de acesso (RBAC).

- [ ] **Schema Design:** Modelar tabelas: `StudentProfile`, `ProfessorProfile`, `Internship`, `Step` (1-8).
- [ ] **Supabase Auth:** Configurar Provider (Google ou Magic Link).
- [ ] **Role Management:** Middleware para proteger rotas `/admin` vs `/student`.
- [ ] **Janela Temporal:** Implementar tabela de configuração `SystemConfig` para permitir/bloquear novos cadastros.
- [ ] **RLS Policies:** Configurar Row Level Security básica (Aluno vê seus dados, Prof vê tudo).

**DoD:** Usuário consegue logar e, dependendo do role, acessar apenas sua dashboard correspondente. Tentativas de cadastro fora da janela temporal são rejeitadas.

---

## FASE 2: FLUXO DO ALUNO (Input de Dados)

**Objetivo:** Permitir que o aluno inicie um processo de estágio e preencha dados.

- [ ] **Dashboard do Aluno:** Visualização do status atual e progresso geral.
- [ ] **Stepper UI:** Componente visual indicando as 8 etapas.
- [ ] **Forms Base:** Criar formulários para Etapa 1 (Cadastro/Termo). Use `react-hook-form` + `zod`.
- [ ] **Server Actions:** Implementar mutations para salvar rascunhos e enviar para aprovação.
- [ ] **Feedback UI:** Toasts de sucesso/erro e Empty States.

**DoD:** Aluno consegue iniciar um estágio, preencher a Etapa 1 e ver o status mudar para "Pendente de Aprovação".

---

## FASE 3: FLUXO DO PROFESSOR (Auditoria)

**Objetivo:** Ferramenta para o orientador validar documentos e destravar etapas.

- [x] **Dashboard do Professor:** Lista de estagiários com filtros (Pendente, Aprovado).
- [x] **Review Interface:** Tela de detalhe mostrando dados submetidos vs requisitos.
- [x] **Actions:** Botões de Aprovar (avança etapa) ou Rejeitar (retorna com feedback) e Ações Administrativas (Ativar/Excluir).
- [ ] **Histórico:** Log simples de quem aprovou e quando.

**DoD:** Professor visualiza submissão da Fase 2, rejeita (com motivo) e depois aprova. Sistema avança aluno para Etapa 2.

---

## FASE 4: O "CORE" DAS 8 ETAPAS (Expansão)

**Objetivo:** Implementar a lógica específica das etapas restantes (Planos de Estágio, Relatórios).

- [x] **Etapas Intermediárias:** Relatórios de atividades e avaliação.
- [x] **Upload de Metadados:** Campos para registrar que documentos físicos foram entregues (Protocolo via Link).
- [ ] **Validações de Negócio:** Regras de datas (ex: Data final > Data inicial).

**DoD:** Ciclo completo de 8 etapas funcional no banco de dados, do início ao fim do estágio.

---

## FASE 5: DOCUMENT ENGINE (Constraint: Client-Side)

**Objetivo:** Gerar PDFs oficiais no navegador para poupar computação serverless.

- [x] **React-PDF Setup:** Configurar renderizador web (`@react-pdf/renderer`).
- [x] **Templates:** Criar layouts para: Termo de Compromisso (Capa).
- [x] **Data Mapping:** Preencher templates com dados do banco (Prisma -> Client Component).
- [x] **Download Action:** Botão "Gerar PDF" na dashboard do aluno.

**DoD:** Aluno clica em "Gerar Termo", PDF é gerado no browser com dados reais e formatação correta, sem call pesado ao backend.

---

## FASE 6: POLISH & LAUNCH

**Objetivo:** Refinamentos finais, UX e preparação para produção.

- [x] **UX Review:** Loading skeletons, transições suaves, empty states.
- [ ] **Error Handling:** Página 404/500 customizada.
- [ ] **Final RLS Audit:** Garantir que nenhum aluno acesse dados de outro.
- [ ] **Documentation:** README atualizado e guia de uso básico.

**DoD:** Projeto pronto para deploy final e entrega à UEMG.

---

## FASE 7: ADVANCED FEATURES & STABILITY

**Objetivo:** Ferramentas administrativas, refinamento de UX e robustez técnica.

- [x] **Profile Management:** Adicionar campo telefone e página "Minha Conta".
- [x] **Admin Tools:** CRUD de Alunos, Professores e Estágios.
- [x] **Internship Management:** Gestão de "Tipos de Estágio" (Definitions) e "Atribuições de Orientação" (Offers).
- [x] **Interface Polish:** Implementar Empty States ricos e Loading Skeletons.
- [x] **Database Resilience:** Mitigar falhas de conexão IPv6 (Prisma/Supabase) e garantir fallbacks.

**DoD:** Admin exporta relatórios, usuários gerenciam perfis, orientações são distribuídas e sistema recupera-se de erros de conexão.

---

## FASE 8: PUBLIC LANDING & ACCESS

**Objetivo:** Porta de entrada profissional e controle de acesso segmentado.

- [x] **Landing Page:** Home page pública com "Hero Section", "Diferenciais" e Call to Action.
- [x] **Blog/News:** Seção de artigos ou avisos na página inicial.
- [x] **Access Control:** Fluxos de login claros e distintos para Alunos e Professores.
- [x] **Student Registration:** Fluxo completo de cadastro do aluno com validações (Zod) e UI (Shadcn).

**DoD:** Visitante não-autenticado acessa Landing Page informativa; Aluno consegue se cadastrar e logar; Login redireciona para dashboard correta.

---

## FASE 9: STAGE LOGIC & REFINEMENTS (The Brain)

**Objetivo:** Implementar a lógica "inteligente" de progressão de estágios, prazos e ações condicionais.

- [x] **Stage Configuration:** Admin gerencia `EtapaDefinicao` (Prazos, Descrições, Ações de Sistema).
- [x] **Sequential Logic:** Aprovar Etapa N desbloqueia automaticamente Etapa N+1 com prazo calculado.
- [x] **Deadline UI:** Exibir prazos claros para o aluno e alertas de atraso para o professor.
- [x] **Conditional Actions:** Botões na dashboard do aluno (ex: "Enviar Link", "Preencher Plano") aparecem apenas quando a etapa exige (System Actions).
- [x] **Manual Recovery:** Scripts SQL robustos para recuperação de desastre (`production_cleanup.sql`).
- [x] **Calendar UI:** Visualização aprimorada de feriados e recessos no calendário administrativo.
- [x] **Final Report:** Fluxo completo de Relatório Final com geração de PDF e assinaturas.
- [x] **Stage Reversion:** Capacidade de reverter etapas concluídas para correção.
- [x] **Stage 1 Reset:** Lógica para reiniciar o fluxo da primeira etapa mesmo sem etapas anteriores concluídas.
- [x] **Full Correction UI:** Desbloqueio total de campos da capa (Empresa/Estágio) para ajustes durante a Etapa 1.
- [x] **AI Text Enhancement:** Integração de IA via OpenRouter ("openrouter/auto") para prover sugestões de preenchimento e aprimoramento ortográfico e profissional dos textos.

**DoD:** Sistema guia o aluno passo-a-passo, gerenciando prazos e bloqueando avanços indevidos, com recuperação simples em caso de falha de dados. E o aluno recebe ajuda de uma IA para elaboração do relatório.

---

## FASE 10: DATABASE OPERATIONS & BACKUP

**Objetivo:** Ferramentas de migração e backup de banco de dados integradas ao sistema.

- [x] **Database Dump:** Dump completo do banco via `pg_dump` (schema + data + roles) usando binários PostgreSQL standalone.
- [x] **Database Migration:** Migração completa para novo projeto Supabase (schema público, dados e auth.users).
- [x] **Admin Backup UI:** Recurso de backup via painel admin (Configurações → Backup) com export JSON de todas as tabelas + auth.users via Supabase Admin API.
- [x] **Auth Migration:** Script SQL para recriar usuários em `auth.users` + `auth.identities` com UUIDs preservados.

**DoD:** Admin consegue baixar backup completo do banco via interface web. Migração entre projetos Supabase documentada e replicável.

---

## PROJECT STATUS: CONCLUDED

**Versão Final (v1.0.0):** 24/01/2026
**Evolução (v1.1.0):** 07/03/2026 - Novo fluxo de correção da Etapa 1 e melhorias de UI.
**Correção (v1.1.1):** 11/03/2026 - Ajuste do motor de cálculo de prazos, agora ancorado na conclusão da etapa predecessora ao invés do updatedAt.
**Nova Feature (v1.2.0):** 22/03/2026 - Integração de Assistente de Inteligência Artificial para edição de texto (Relatórios e Atribuições) e melhorias contínuas de UX.
**Correção/Evolução (v1.2.1):** 30/03/2026 - Condicionais anti-edição de relatórios (Timezone Trap fix, ancoradas no fim diário SP) e expurgo da propriedade `dataLimite`. Melhorias vitais em UX Accessibilty para indicadores e badges informacionais de bloqueios.
**Refinamento IA (v1.2.2):** 31/03/2026 - Otimização estrita de System Prompts para inibição de Markdown e fillers conversacionais em textareas, além da alteração na nomenclatura dos botões (Sugestão de Aprimoramento).
**Migração & Backup (v1.3.0):** 03/05/2026 - Migração para novo projeto Supabase, recurso de backup administrativo via JSON (Prisma + Auth Admin API) e documentação de disaster recovery.
**Auditoria de Segurança (v1.4.0):** 25/05/2026 - Resolução de vulnerabilidades críticas. Implementação de Ownership Checks (Prevenção de IDOR) em Server Actions, proteção RBAC de borda no Middleware via `user_metadata`, autenticação em rotas de exportação de documentos e sanitização rigorosa de erros do Prisma (Prevenção de vazamento de logs/PII).
**Segurança Avançada e Automação (v1.5.0):** 29/05/2026 - Remediação de Supply Chain (atualização para Next.js 14.2.35 corrigindo CVEs críticas), ativação global de Row Level Security (RLS) no Supabase (bloqueando acesso público não autorizado), e introdução de envio automatizado de E-mails (via Nodemailer) em massa e individual para estagiários, notificando etapas atrasadas e mensagens de orientação.
**E-mail Alternativo e API Brevo (v1.6.0):** 03/06/2026 - Resolução da falha de entregabilidade de e-mails na Vercel migrando do SMTP clássico do Gmail para a API HTTP da Brevo. Introdução de campo obrigatório de E-mail Alternativo pessoal no perfil para contornar bloqueio de servidores institucionais da UEMG, com alertas e atualização completa nos manuais do sistema.
**E-mail Alternativo UX Bug (v1.6.1):** 07/06/2026 - Correção de estado de UI nos painéis administrativos que "apagavam" visualmente os e-mails alternativos recém-cadastrados por omissão no initialData. Melhorias nos formulários e manuais separando claramente os papéis de login (E-mail Institucional) e de comunicação (E-mail Alternativo) para evitar confusão de suporte.
**Atualização de Período Segura (v1.7.0):** 03/08/2026 - Implementação de destrava controlada do Período Letivo do aluno. A edição autônoma no perfil foi atrelada à inexistência de contratos ativos (bloqueio duplo: UI e API), permitindo avanço de semestre sem corromper auditorias de processos em andamento.
**Dashboard Consolidado (v1.8.0):** 23/08/2026 - Implementação do painel de métricas históricas para o Administrador, incluindo tracking persistente de validações de autenticidade documental via hash e refatoração de consultas paralelas para performance (TTFB).

O projeto SGE-UEMG atingiu todos os requisitos funcionais e não-funcionais planejados. O sistema está pronto para implantação em ambiente de homologação/produção.

### Próximos Passos (Maintenance & Growth)

1. **Monitoramento:** Acompanhar logs de erro em produção.
2. **Feedback Loop:** Coletar feedback dos primeiros usuários reais (Alunos/Professores).
3. **Novas Features:** Considerar integração com sistemas legados da UEMG se necessário.

