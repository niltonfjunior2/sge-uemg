# KNOWLEDGE BASE & LESSONS LEARNED
>
> Este arquivo é a memória evolutiva do projeto. Sempre que um erro complexo for resolvido ou uma decisão de configuração não óbvia for tomada, registre aqui.

## FORMATO DE REGISTRO

### [DATA] - [CATEGORIA] Título Curto do Problema

**Contexto:** Breve descrição do erro ou do requisito obscuro.
**Solução:** O que foi feito para resolver (snippets de código, comandos, mudança de lógica).
**Prevenção:** O que verificar no futuro para evitar reincidência.

---

## REGISTROS

### [2026-01-16] - [INFRA] Cold Starts do Supabase

**Contexto:** O banco entra em pausa após inatividade. A primeira requisição falhava por timeout.
**Solução:** Implementada lógica de retry no cliente Prisma e aviso de "Carregando sistema..." na UI.
**Prevenção:** Testar sempre a aplicação após 1h de inatividade.

### [2026-01-16] - [DB] Conexão Prisma vs Supabase (IPv4/IPv6)

**Contexto:** Erro `P1001` e `P4002` ao rodar `prisma db push`. O Supabase usa IPv6 para conexão direta, e algumas redes/ISPs não suportam.
**Solução:**

1. Uso do Session Pooler (porta 5432) no `DIRECT_URL` para contornar restrição de IPv6.
2. Fallback para execução manual de SQL (`sql/` scripts) quando a migração via CLI falha.
**Prevenção:** Manter scripts SQL atualizados para alterações de schema manuais.

### [2026-01-16] - [NEXTJS] Middleware e Rotas Públicas

**Contexto:** Loop de redirecionamento ou bloqueio indevido na Landing Page (`/`).
**Solução:** Explicitar exceção para `req.nextUrl.pathname !== '/'` no middleware.
**Prevenção:** Ao criar páginas públicas, adicionar imediatamente à whitelist do middleware.

### [2026-01-16] - [UX] Skeletons e Feedback Visual

**Contexto:** "Piscada" de conteúdo ou tela branca enquanto dados carregam.
**Solução:** Criação de `loading.tsx` com Skeletons (Shadcn UI) replicando o layout final.
**Prevenção:** Sempre criar `loading.tsx` para rotas que fazem fetch de dados no servidor (`await`).

### [2026-01-17] - [PRISMA] Nomenclatura de Campos no Cliente

**Contexto:** Erro `Argument 'nomeCompleto' is missing` ao tentar criar registro. O Prisma exige o nome da propriedade definida no modelo (`nomeCompleto`), não o nome da coluna no banco (`nome_completo`).
**Solução:** Ajustar o objeto `data` para usar `nomeCompleto`.
**Prevenção:** Verificar sempre o `schema.prisma` para ver o nome da propriedade (antes do `@map`) ao escrever queries.

### [2026-01-17] - [NEXTJS] Importação de Zod em Server Actions

**Contexto:** Erro ao importar schema Zod de um arquivo `'use server'` para um Client Component.
**Solução:** Mover schemas de validação para arquivos "puros" (ex: `schemas/register-schema.ts`) sem diretiva `'use server'`.

### [2026-01-17] - [PRISMA] Tratamento de Erro P2002 (Unique Constraint)

**Contexto:** Ao cadastrar usuário com email ou matrícula já existentes, o Prisma retorna erro genérico ou falha silenciosa se não tratado especificamente.
**Solução:** Capturar `error.code === 'P2002'` no bloco catch e verificar `error.meta.target` para identificar qual campo (email/matricula) violou a unicidade, retornando mensagem amigável.
**Prevenção:** Sempre tratar P2002 em formulários de criação (cadastro, novo estágio).

### [2026-01-18] - [AUTH] Confirmação de Email vs Supabase Admin

**Contexto:** Novos cadastros de alunos falhavam no login com erro "Email not confirmed". O projeto requer que o cadastro já nasça ativado, sem necessidade de clicar em link de email.
**Solução:** Substituir `supabase.auth.signUp` (que exige confirmação) por `supabaseAdmin.auth.admin.createUser` com `email_confirm: true`. Para isso, foi necessário configurar `SUPABASE_SERVICE_ROLE_KEY` no `.env` e criar um cliente admin (`src/lib/supabase/admin.ts`).
**Prevenção:** Se precisar criar usuários "pré-aprovados", sempre use a API Admin do Supabase, pois a API pública sempre dispara o fluxo de email confirm (a menos que desligado no painel, o que pode ser inseguro globalmente).

### [2026-01-18] - [PRISMA] Multi-Schema e Supabase

**Contexto:** Erro `P4002` (Inconsistent Schema) ao dar `db push`. O Supabase possui schemas internos (`auth`, `storage`) que conflitam se o Prisma não estiver ciente.
**Solução:** Habilitar `previewFeatures = ["multiSchema"]`, definir `schemas = ["public", "auth"]` no datasource e adicionar anotação `@@schema("public")` em todos os modelos.
**Prevenção:** Em projetos Supabase com Prisma, inicie já com configuração Multi-Schema para evitar refatoração massiva de annotations depois.

### [2026-01-18] - [DEV] Prisma Generate com Server Rodando (Windows)

**Contexto:** Erro `EPERM: operation not permitted` ao rodar `npx prisma generate` enquanto `npm run dev` está ativo no Windows. O binário do cliente fica travado pelo processo do Node.
**Solução:** Parar o servidor de desenvolvimento antes de regenerar o cliente Prisma.
**Prevenção:** No Windows, sempre derrubar o servidor antes de comandos que alteram `node_modules/.prisma`.

### [2026-01-18] - [UX] Terminologia (Oferta vs Atribuição)

**Contexto:** O termo "Oferta de Estágio" causava confusão, parecendo algo para alunos se candidatarem, quando na verdade era uma alocação de carga horária de professor ("Atribuição de Orientação").
**Solução:** Refatoração de textos na UI para "Atribuição" e "Orientação", mantendo o nome técnico da tabela `OfertaEstagio` para evitar quebra de contratos de banco.
**Prevenção:** Validar glossário com o cliente antes de modelar o banco, ou aceitar que a UI pode divergir do Schema.

### [2026-01-19] - [DB] Enum vs String em Inputs Dinâmicos

**Contexto:** O formulário envia valores dinâmicos ("Presencial", "Remoto") vindos da tabela `informacoes_gerais_estagio`. O banco tinha colunas `modalidade` e `tipo_documentacao` tipadas como ENUM fixo (`USER-DEFINED`). Isso causou erro de validação do banco ao tentar salvar valores que tecnicamente eram strings válidas mas não correspondiam ao tipo ENUM estrito do Postgres.
**Solução:** Conversão das colunas para `TEXT` (`ALTER COLUMN ... TYPE text`), permitindo flexibilidade total para opções cadastradas dinamicamente no painel administrativo.
**Prevenção:** Se o conjunto de opções de um campo é gerenciado pelo usuário (CRUD), evite ENUM no banco. Use `TEXT` e valide na aplicação/schema.

### [2026-01-19] - [TYPESCRIPT] Tipagem Estrita em Server Actions com Prisma

**Contexto:** Mesmo após alterar o `schema.prisma` para `String`, o TypeScript no editor (`actions.ts`) continuava acusando erro de que `string` não era assignable para o tipo antigo (que ele cacheou ou inferiu incorretamente).
**Solução:** Casting explícito para `any` (`valor as any`) nos campos problemáticos dentro do Server Action para destravar o build, assumindo que a validação Zod e o banco (agora TEXT) garantem a integridade.
**Prevenção:** Em refatorações de tipo de banco, confiar mais no `prisma generate` e reiniciar o TS Server. Se persistir, o cast é uma solução pragmática para não bloquear o fluxo.

### [2026-01-19] - [NEXTJS] Webpack Cache e Prisma

**Contexto:** Erro `TypeError: __webpack_modules__[moduleId] is not a function` após mudanças drásticas de schema e regeneração do cliente Prisma.
**Solução:** Limpeza agressiva do cache: `rm -rf .next` seguido de `npx prisma generate` e `npm run build`.
**Prevenção:** Ao encontrar erros crípticos de módulo no Next.js após mexer no banco, limpar a pasta `.next` é o primeiro passo.

### [2026-01-20] - [JS/DATE] Tratamento de Datas e Timezones (UTC vs Local)

**Contexto:** Datas salvas como `YYYY-MM-DD` no banco (via Prisma `DateTime`) eram interpretadas como UTC Midnight. Ao exibir no frontend usando `new Date()`, o navegador convertia para o fuso local (Brasília -3h), resultando no dia anterior.
**Solução:** Usar `toLocaleDateString('pt-BR', { timeZone: 'UTC' })` para garantir que a data seja exibida exatamente como salva, ignorando o deslocamento do navegador, ou usar bibliotecas como `date-fns-tz` para controle explícito.
**Prevenção:** Em sistemas de datas "burocráticas" (sem hora relevante), tratar sempre como UTC na renderização.

### [2026-01-20] - [NEXTJS] Interatividade em Páginas Server-Side (Server Actions + Client Components)

**Contexto:** Necessidade de adicionar botões com confirmação (Dialogs) e feedback (Toast) em uma página detalhe renderizada no servidor (`page.tsx`). Server Actions não podem ser invocados diretamente de event handlers em Server Components.
**Solução:** Criar um "Client Component wrapper" (ex: `contract-actions.tsx`) que contém a lógica de UI (`useState`, `useTransition`, `AlertDialog`) e invoca a Server Action. Esse componente é então importado na página Server-Side.
**Prevenção:** Segregar claramente: Página (Fetch dados) -> Componente Cliente (Interatividade) -> Server Action (Mutação).

### [2026-01-21] - [DB] Restauração de Schema e Seed Manual (Wipe Recovery)

**Contexto:** O banco de dados foi completamente apagado. A tentativa de usar `prisma db push` causou conflitos com tipos ENUM já existentes ou definições inconsistentes. Além disso, o seed script (`seed.ts`) falhava por depender de tipos do `@prisma/client` desatualizados em relação ao banco vazio.
**Solução:**

1. Criação de script SQL manual completo (`sql/schema.sql`) com `DROP TABLE/TYPE IF EXISTS CASCADE` para garantir limpeza total antes da recriação.
2. Criação de script SQL de seed (`sql/seed_admin.sql`) para inserir dados estáticos (etapas, configs) e usuários ADMIN via SQL direto, contornando a necessidade do cliente Prisma durante a restauração de emergência.
**Prevenção:** Manter sempre um `schema.sql` atualizado como fonte da verdade "fallback" para disaster recovery, sem depender exclusivamente das migrations do Prisma cli.

### [2026-01-21] - [REACT] Erro `TypeError: Cannot read properties of null (reading 'useContext')` após Wipe

**Contexto:** Após limpar o banco, usuários viam este erro ao tentar acessar páginas protegidas ou usar componentes de UI.
**Solução:**

1. O erro geralmente indica que um Hook (ex: `useToast` ou AuthContext) está sendo chamado fora de seu Provider, OU que o estado de autenticação (cookies) no navegador está tentando carregar sessões que não existem mais no banco (profile null).
2. Adição explícita do componente `<Toaster />` no `RootLayout` (`src/app/layout.tsx`).
3. Limpeza de cookies do navegador para forçar novo login.
**Prevenção:** Em casos de wipe de banco, sempre limpe os cookies do navegador e garanta que Providers globais (Toast, Auth) estejam no nível mais alto do Layout.

### [2026-01-22] - [PRISMA/REFACTOR] Renomeação de Enums (APROVADO -> ATIVO)

**Contexto:** Decisão de mudar a terminologia de `APROVADO` para `ATIVO` nos status de estágio.
**Solução:**

1. Alteração no `schema.prisma`.
2. Busca global e substituição de string literals no código TypeScript.
3. Tratamento de erro `EPERM` no Windows ao rodar `prisma generate`: é obrigatório parar o servidor Next.js antes.
**Prevenção:** Ao renomear Enums, lembre-se que o TypeScript não "pega" literais usados em comparações de string ou queries raw/filtros manuais. É necessário grep global.

### [2026-01-22] - [UI/CALENDAR] Visualização de Feriados e Timezones

**Contexto:** O componente `Calendar` (DayPicker) e o objeto `Date` do JS convertem datas para o fuso local, fazendo feriados (yyyy-mm-dd) aparecerem no dia anterior.
**Solução:**

1. Tratar as datas de feriados puramente como strings `YYYY-MM-DD` (UTC text) para comparação.
2. Usar `modifiers` do `react-day-picker` para injetar classes CSS condicionais (bg-red-100 para feriados).
**Prevenção:** Em calendários visuais, evite comparar objetos `Date` completos; normalize para string de data.

### [2026-01-22] - [DB/SEED] System Actions no Seed

**Contexto:** O botão "Preencher Capa" não aparecia no Dashboard do Aluno para a Etapa 1, mesmo com o código Frontend correto.
**Solução:** Identificado que o `seed.ts` criava a Etapa 1 sem preencher o campo `systemAction` (que o código espera ser `'GENERATE_DOC_CAPA'`). O seed foi atualizado e o Admin Panel foi usado para corrigir os dados existentes.
**Prevenção:** Ao criar features que dependem de configurações de banco (flags, enums, actions), atualizar imediatamente o `seed.ts` para que novos ambientes de dev já nasçam funcionais.

### [2026-01-22] - [REACT-PDF] Geração de PDF com Dados Dinâmicos

**Contexto:** Necessidade de gerar um PDF "Capa de Estágio" que reflete dados editáveis pelo aluno (Supervisor, Atribuições).
**Solução:** Implementação de um fluxo híbrido:

1. Formulário de Edição (`/editar`) que salva no banco via Server Action.
2. Rota de PDF (`/pdf/route.tsx`) que lê do banco atualizado e renderiza o template `@react-pdf`.
**Prevenção:** Não passar dados complexos via URL params para o gerador de PDF. Sempre persistir primeiro, depois gerar o documento a partir do ID do registro.

### [2026-01-22] - [UX] Badge Color Standardization

**Contexto:** O status "ATIVO" aparecia em múltiplas cores (azul, default, verde) dependendo da tela.
**Solução:** Criação de uma variante `success` explícita no componente `Badge` (`bg-green-600`) e padronização global.
**Prevenção:** Evitar classes de cores hardcoded (`bg-green-500`) nos componentes de negócio. Usar sempre variantes do Design System (`variant="success"`) para garantir consistência.

### [2026-01-23] - [REACT-PDF] Erro `Component is not a constructor` no Next.js App Router

**Contexto:** Ao tentar gerar PDF no server side (`route.tsx`), ocorria o erro `TypeError: a.Component is not a constructor`. Isso acontece por incompatibilidade da versão 4.x do `@react-pdf/renderer` com a forma como o Next.js empacota componentes de servidor.
**Solução:**

1. Downgrade para `@react-pdf/renderer@3.4.4`.
2. Adição de configuração no `next.config.mjs`:

   ```js
   webpack: (config) => {
       config.resolve.alias.canvas = false;
       config.resolve.alias.encoding = false;
       return config;
   },
   experimental: {
       serverComponentsExternalPackages: ['@react-pdf/renderer'],
   },
   ```

**Prevenção:** Ao usar bibliotecas que dependem de Node.js streams ou binários (como PDF generation) no App Router, sempre configure `serverComponentsExternalPackages` e verifique issues de compatibilidade de versão.

### [2026-01-23] - [REACT-PDF] Layout e Quebra de Linha

**Contexto:** Labels longos ("MODALIDADE DO ESTÁGIO") quebravam linha em colunas estreitas (25%), desformatando o PDF.
**Solução:** Ajuste fino de layout: aumentar largura da label para 30% e, crucialmente, reduzir a fonte apenas desses labels para 9pt.
**Prevenção:** Em geração de PDF, não confie no "auto layout". Teste com os maiores valores possíveis e defina larguras fixas ou reduções de fonte preventivas.

### [2026-01-23] - [UX] Prazos e Datas Nulas

**Contexto:** O prazo de uma etapa não aparecia quando `dataLimite` era null no banco (estágios ativados em lote ou sem trigger específico).
**Solução:** Implementação de "Fallback de Cálculo": se `dataLimite` for null, calcular em tempo de execução (`updatedAt` + `prazoDias`). Se ainda assim falhar, exibir "A definir" em vez de esconder o campo.
**Prevenção:** Nunca confie que cronogramas futuros estarão populados no banco. Sempre tenha lógica de UI para lidar com datas indefinidas ou calculá-las on-the-fly.

### [2026-01-23] - [UI] Consistência de Botões de Ação

**Contexto:** Botões de ações críticas ("Preencher Plano") tinham estilo secundário (`outline`), passando despercebidos comparados a outros ("Emitir Capa").
**Solução:** Padronização visual para usar sempre o estilo "Call to Action" (Primary, Large, Shadow) para a *próxima ação imediata* do aluno, independente de qual seja.
**Prevenção:** A hierarquia visual deve seguir a prioridade da tarefa do usuário, não o tipo de documento. Se é a única coisa que ele pode fazer agora, deve ser o botão mais chamativo.

### [2026-01-24] - [UX/LOGIC] Lógica de Stepper e Status "Concluído"

**Contexto:** O componente Stepper usava um valor hardcoded (8) para determinar se todas as etapas estavam concluídas. Isso causava falha visual (último step não ficava verde) quando o número real de etapas diferia.
**Solução:** Implementação de lógica dinâmica: `Current Step = First Pending Step ID` OU `Total Steps + 1` se tudo aprovado.
**Prevenção:** Em componentes de progresso sequencial, nunca assuma um número fixo de passos. Calcule sempre `Total + 1` como o estado de "Checkmate/Vitória".

### [2026-01-24] - [CSS/MATH] Overflow em Barra de Progresso

**Contexto:** Ao definir o passo atual como `Total + 1`, o cálculo de largura da barra de progresso `(Current / Total) * 100` resultava em >100%, quebrando o layout visual.
**Solução:** Uso de `Math.min(100, ...)` e `clamp` para garantir que a barra nunca exceda 100%.
**Prevenção:** Qualquer cálculo de porcentagem para UI deve ter limites superiores e inferiores explícitos (clamp).

### [2026-01-24] - [LOGIC] Reversão de Status (Undo)

**Contexto:** Professores precisavam reverter uma etapa concluída ("ATIVO") para correções ("EM_ANALISE"). Apenas mudar o status não era suficiente, pois campos como `dataConclusao` e `observacoes` antigos persistiam.
**Solução:** Criação de Action específica `revertStage` que limpa os metadados (`dataConclusao: null`) ao voltar o status, garantindo um estado limpo para nova avaliação.
**Prevenção:** "Desfazer" uma ação de negócio geralmente exige mais do que apenas reverter uma flag; é preciso limpar os efeitos colaterais daquela ação (datas, assinaturas).

### [2026-01-24] - [DB/OPS] Limpeza Real de Produção (TRUNCATE vs DELETE)

**Contexto:** Para testes finais, foi necessário limpar o banco. O uso de `DELETE` ou scripts parciais deixava IDs inflacionados (ex: Aluno ID 50), o que é feio para uma entrega final.
**Solução:** Uso de `TRUNCATE TABLE ... RESTART IDENTITY CASCADE`. O `RESTART IDENTITY` é crucial para resetar as sequences auto-incrementais para 1.
**Prevenção:** Em scripts de "Clean Slate" para produção/homologação, sempre use `RESTART IDENTITY` para dar a sensação de sistema novo em folha.

### [2026-01-24] - [SECURITY] Cadastro de Professores

**Contexto:** O formulário de cadastro de novos professores não deve ser público. O cadastro indiscriminado poderia permitir que alunos se passassem por professores.
**Solução:** Remoção/Omissão da rota pública de cadastro de professores (`/auth/cadastro/professor`). A criação de contas de orientadores deve ser feita exclusivamente via Admin ou scripts de seed, garantindo controle institucional.
**Prevenção:** Em sistemas acadêmicos, a role "Professor" é de alta confiança. Nunca exponha self-service registration para roles administrativas ou de supervisão sem validação manual.

### [2026-02-02] - [UI/CALENDAR] Timezone Shift em Componentes de Data

**Contexto:** Ao passar datas do banco (UTC) para o componente de calendário (React DayPicker + date-fns), o locale do navegador aplicava offset (-3h), fazendo com que feriados aparecessem no dia anterior (ex: 25/12 virava 24/12).
**Solução:**

1. Tratamento da data como string ISO fixa (`date.toISOString().split('T')[0]`) para comparação, ignorando o objeto Date local do JS.
2. Adição de `locale={ptBR}` explícito no componente Calendar.
**Prevenção:** Em calendários, nunca use `date.toString()` ou `format()` do date-fns diretamente em objetos Date vindos do banco sem antes normalizar ou forçar UTC, especialmente em checks de igualdade de dia.

### [2026-02-02] - [UX/AUTH] Feedback de Erro de Login Persistente

**Contexto:** A mensagem de erro "Invalid login credentials" retornada pelo Supabase era exibida estaticamente. Se o usuário errasse novamente, ele não recebia feedback visual de nova tentativa, pois a mensagem já estava lá.
**Solução:**

1. Substituição do div de erro por `useToast`.
2. Adição de timestamp ao state do form action para forçar re-render do `useEffect` mesmo se a mensagem de erro for idêntica.
3. Tradução das mensagens de erro do backend no frontend antes de exibir.
**Prevenção:** Para feedback de ações repetitivas (como login), use notificações efêmeras (Toasts) ou garanta que o estado de erro seja "limpo" ou "atualizado" visualmente a cada tentativa.

---

### [2026-03-07] - [LOGIC] Reset de Etapa Inicial (Stage 1)

**Contexto:** O sistema permitia retroceder apenas etapas concluídas. Para a Etapa 1, se o aluno cometia um erro, o professor não conseguia "resetar" o status para Pendente pois não havia etapa anterior.
**Solução:** Ajuste na `revertStage` para identificar se não há etapas ATIVAS e, nesse caso, permitir o "reset" da primeira etapa encontrada (que esteja em análise ou rejeitada), limpando seus metadados.
**Prevenção:** Em fluxos sequenciais, o estado "Zero" (primeira etapa) deve ser tratável como um caso especial de reversão/reset.

### [2026-03-07] - [PRISMA] Atualização Multi-Entidade em Correções

**Contexto:** A correção da Capa do Estágio envolvia campos de tabelas diferentes (`CampoEstagio` e `ContratoEstagio`). A primeira implementação atualizava apenas dados do supervisor.
**Solução:** Expansão da Server Action `updateEstagioAction` para aceitar todos os campos editáveis e executar um `prisma.$transaction` atualizando as duas tabelas simultaneamente, garantindo a integridade dos dados da empresa e do contrato (modalidade, carga horária).
**Prevenção:** Sempre verificar se um formulário de "Edição de Dados" abrange todas as entidades relacionadas que o usuário espera alterar.

### [2026-03-07] - [UX] Contraste em Botões com Bordas Coloridas (Amber)

**Contexto:** Botões `variant="outline"` com cores customizadas (texto âmbar) perdiam contraste no hover, pois o texto permanecia âmbar e o fundo ficava uma cor muito clara, ou o usuário perdia a percepção de clique.
**Solução:** Forçar `hover:bg-amber-600 hover:text-white` em botões de alerta/notificação para garantir contraste máximo e feedback visual claro de que o botão está selecionado.
**Prevenção:** Testar acessibilidade e contraste de hover em todos os botões que não seguem as variantes padrão do Shadcn.

### [2026-03-11] - [LOGIC/DOMAIN] Cálculo de Prazos em Fluxos Sequenciais

**Contexto:** O cálculo de prazo das etapas (ex. "Plano de Atividades") estava incoerente. O sistema somava o `prazoDias` à data `updatedAt` do próprio registro da etapa pendente. Como o `updatedAt` muda a cada alteração ou geração do placeholder, o prazo "deslizava" e não correspondia à realidade.
**Solução:** Refatoração do motor de cálculo de datas limite no frontend (Dashboard, Relatórios) para ancorar o início do prazo na `dataConclusao` da etapa imediatamente anterior (ou `dataInicioPrevista` do contrato, se for a Etapa 1).
**Prevenção:** Em sistemas de *workflow* baseados em pré-requisitos, nunca utilize campos transientes como `updatedAt` do próprio alvo para calcular SLAs ou prazos bloqueantes. Sempre adote eventos imutáveis consolidados (data finalização da trava anterior) como fita de largada do cronômetro.

### [2026-03-22] - [AI/INTEGRATION] OpenRouter Model Routing e Erros 400

**Contexto:** Ao tentar usar IA gratuita via OpenRouter, a definição de um modelo preview específico (`gemini-2.0-flash-lite...`) retornava Erro 400 (Invalid Model ID), indicando indisponibilidade genérica para a chave/plano atual.
**Solução:** Configurar o parâmetro dinâmico `model: "openrouter/auto"` na payload da requisição. Isso permite que a infraestrutura selecione automaticamente o melhor modelo gratuito (como o Mistral 7B) garantidamente disponível para a conta. Inserida também uma trava no prompt ("DEVE estar em Português do Brasil") para inibir respostas em inglês que costumam ser padrão.
**Prevenção:** Em integrações com agregadores de IA cujo foco seja o "free tier", utilize configurações "auto" para evitar quebra silenciosa de modelos depreciados ou preview. Forçe o idioma local explicitamente no system prompt.

### [2026-03-22] - [NEXTJS/HMR] Erro de RPC Catch em Novas Server Actions

**Contexto:** Ao criar uma nova Server Action (`aprimorarAtividadesComIA`) com o servidor Next.js (`npm run dev`) ativamente rodando, o Client Component lançou um erro silencioso para o bloco `catch` ("Erro na conexão com a IA") logo na primeira tentativa.
**Solução:** O erro aconteceu porque o bundler gerou um novo ID para a RPC Server Action no backend, porém na árvore local daquele momento o cliente desconhecia esse ID. Bastou realizar um Hard Refresh (F5) para ressincronizar os índices Client-Server.
**Prevenção:** Ao invocar uma Server Action recém-escrita num botão React (Client), lembre-se de recarregar a visualização no seu navegador antes para mapear o bundle dinamicamente gerado.

### [2026-03-30] - [LOGIC/DOMAIN] Cálculo de Prazos Dinâmico e Descarte do `dataLimite` Estático

**Contexto:** Prazos de avaliação e preenchimento de relatórios estavam apresentando inconsistências (visuais e lógicas) caso atualizados via status ou triggers manuais, ancorando em propriedades temporais sujas. O metadado isolado `dataLimite` mascarava recomputos reais dependentes do fim da atividade extra.
**Solução:** Abandono arquitetônico resoluto da propriedade `dataLimite` estática na camada Desktop Web; passamos a inferir ativamente (on-the-fly) a data somando a última `dataAtividade` (diário) do sistema e suas próprias heurísticas de tolerância da `EtapaDefinicao` (o "prazoDias" nominal).
**Prevenção:** O padrão é claro. Prazos cuja nascente se referenciam ativamente no final da etapa alheia (desenvolvimento de relatórios via diário letivo) tornam sua estabilidade infinitamente mais barata de calcular em "Views"/"Componentes de React" via derivação matemática rápida, sem correr risco de desatualização de Estado Bancário em cascata.

### [2026-03-30] - [JS/DATE] Condicionais de Bloqueio Protegidos Hibridamente (Timezone Trap / Vercel Edge)

**Contexto:** A trava de relatórios operava `new Date() <= dataDaUltimaAtividade`, desengatando permissões pelo simples passar das horas em "UTC-0" dentro da infraestrutura Cloud. Logo, estudantes teriam preenchimentos autorizados antecipadamente à noite de Brasília.
**Solução:** Utilização irrestrita da variável protetora `.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"})` para qualquer rotina de Server Component dependente de "Hoje vs Amanhã" antes do re-cast puro do objeto Date em milissegundos localizados.
**Prevenção:** Não defina "Today" em Cloud Hosts se a condição de liberação temporal for imperativamente guiada aos residentes GMT-3 (Ex: dia oficial das atividades do Brasil vira 3 horas do outro em Edge Global). Declare sua âncora textual local explicitamente.

### [2026-03-30] - [UX/UI] Interceptação Visual Falsa pelo Paradigma "Disabled Buttons"

**Contexto:** Para transmitir proibições de formulários com base em datas ("Abre amanhã"), o botão principal de tela era envelopado na macro nativa `disabled={true}`, derrubando contrastes (Opacidade < 50%) para legibilidade catastrófica, mascarando um comunicado de valor informativo como falha de UI.
**Solução:** Refatoração sem remorso. Seletividade de div/badges exclusivas de status (`bg-amber-100` e alerta texturado), separando categoricamente "Call to Action impossível temporariamente" de "Painel Dinâmico Informativo".
**Prevenção:** Componentes Desabilitados do Core UI enviam um sinal subconsciente de inoperabilidade sem sentido prático. Se você deseja evidenciar o "Por que do bloqueio", afirme isso abertamente injetando Cores/Design que favoreçam o Contraste e a Informação.

### [2026-03-31] - [AI/UX] Geração de Texto Puro para Inputs (Prompt Strictness)

**Contexto:** Ao usar IA (OpenRouter) para aprimorar textos destinados a componentes `<textarea>` nativos, a IA por padrão retornava formatação Markdown (`**negrito**`) e frases conversacionais ("Com certeza! Abaixo o seu texto..."), corrompendo o valor final da string no formulário.
**Solução:** Substituição de prompts declarativos simples por "System Prompts" altamente diretivos e numerados, bloqueando expressamente: (1) Saudações/Introduções, (2) Formatação Markdown (asteriscos, hashtags) e (3) Exigindo APENAS o texto aprimorado final.
**Prevenção:** Para qualquer ferramenta de IA cujo output sirva como injeção direta em banco de dados ou painel não-RTE (Rich Text Editor), o prompt DEVE proibir conversação e formatação estruturada de texto imperativamente.

### [2026-05-03] - [DB/OPS] Migração Completa entre Projetos Supabase (Schema + Data + Auth)

**Contexto:** Ao migrar o SGE para um novo projeto Supabase, o `supabase db dump` exigia Docker Desktop (indisponível). Usar `pg_dump` diretamente com a porta padrão 5432 (pooled) falhava. Após o dump, a restauração no novo banco revelou que: (1) o schema `public` tem dependências de tipos/enums que já existem no Supabase, (2) a tabela `profiles` tem FK para `auth.users` que impede inserção de dados, e (3) os usuários de `auth.users` não são migrados automaticamente.
**Solução:**

1. **Dump**: Usar `pg_dump --schema=public` pela porta `6543` (Session Pooler direto) ao invés de `5432`.
2. **Schema**: Aplicar o dump com `psql -f` — erros de "type already exists" são inofensivos (enums padrão do Supabase).
3. **Data**: Dropar FK `profiles_id_fkey` antes da importação, recriar depois com `NOT VALID` para permitir dados órfãos temporariamente.
4. **Auth**: Criar manualmente os usuários em `auth.users` + `auth.identities` via SQL, usando os **mesmos UUIDs** dos profiles migrados e senha temporária via `crypt()`.
**Prevenção:** Em migrações entre projetos Supabase, sempre trate o schema público e o auth como processos separados. Mantenha um script SQL de criação de usuários auth como parte do disaster recovery. A Admin API (`listUsers`) não exporta senhas — aceite que senhas precisam ser redefinidas.

### [2026-05-03] - [FEATURE] Backup Administrativo via Prisma + Supabase Admin API

**Contexto:** A necessidade de fazer dumps recorrentes do banco exigia ferramentas CLI (pg_dump, Docker, Supabase CLI) que nem sempre estão disponíveis. Solução: embutir a funcionalidade de backup diretamente no painel admin do sistema.
**Solução:**

1. **API Route** (`/api/backup`): Consulta todas as 16 tabelas via `Promise.all` com Prisma + `supabase.auth.admin.listUsers()` para incluir auth.users.
2. **Segurança**: Verificação de role `ADMIN` via `getCurrentUserRole()` antes de permitir o export.
3. **Output**: JSON com metadados (versão, data, contagem) + dados completos, retornado como download via `Content-Disposition: attachment`.
4. **Limitação**: Senhas de auth.users não são exportáveis (segurança do GoTrue). Ao restaurar, é necessário redefinir senhas.
**Prevenção:** Em ambientes serverless (Vercel), não é possível executar `pg_dump`. Prisma + Admin API é a alternativa viável para backup de dados aplicacionais. Para backup completo com senhas, use `pg_dump` localmente com acesso direto ao banco.

### [2026-05-25] - [SECURITY] IDOR e Ownership em Server Actions

**Contexto:** Server Actions que recebem IDs (ex: `deleteAtividade(id)`) validavam apenas se o usuário tinha o perfil "ALUNO", mas não validavam se a atividade pertencia àquele aluno, permitindo edição forjada de dados de terceiros.
**Solução:** Criação de um helper de segurança universal (`assertAlunoOwnsContract`) que é invocado no topo da Action. Ele cruza o `contratoId` alvo com o `auth.getUser().id` via query no Prisma antes de permitir a mutação.
**Prevenção:** Em sistemas Multi-Tenant ou com dados isolados por usuário, Server Actions nunca devem confiar em IDs de payload sem validar *Ownership* no banco de dados.

### [2026-05-25] - [SECURITY/NEXTJS] Edge RBAC via JWT User Metadata

**Contexto:** O middleware do Next.js precisava proteger a rota `/admin`. Fazer uma query de banco (`supabase.from('profiles')`) no Edge era custoso e inviável. Proteger o acesso via React Layout permitia consumo de banda e recursos antes do bloqueio.
**Solução:** Gravação da "role" (`ADMIN`, `PROFESSOR`, `ALUNO`) diretamente no `user_metadata` do Supabase Auth durante o cadastro. O JWT carrega essa metainformação, permitindo ao `middleware.ts` decodificar a sessão instantaneamente no Edge e bloquear a request antes de tocar na aplicação React.
**Prevenção:** Para RBAC (Role-Based Access Control) hiper-rápido, evite rodadas ao banco. Salve papéis no token de autenticação e aplique as defesas na camada Middleware (Edge).

### [2026-05-25] - [SECURITY/API] Proteção de Rotas de Exportação (PDFs)

**Contexto:** Endpoints do tipo GET (`route.tsx`) para renderização de PDFs estavam desprotegidos e recebiam parâmetros abertos na URL (`/api/documents/[id]/route.tsx`), expondo PIIs de alunos a acessos anônimos externos.
**Solução:** Injeção obrigatória de sessão (`supabase.auth.getUser()`) dentro do `route.tsx`, com validação estrita: somente Administradores, Professores vinculados e o próprio dono do contrato podem gerar a visualização.
**Prevenção:** Não tratar Server Components e Route Handlers "simples" como visualizadores inofensivos. Se emite dados, é uma API e deve ter validação de sessão embutida, independente de qual UI o invoca.

### [2026-05-25] - [SECURITY] Vazamento de Infraestrutura (Prisma/Stack traces)

**Contexto:** Erros não tratados ou repassados genericamente (`catch (error) { return { error: error.message } }`) exibiam ao cliente as estruturas internas do Prisma e metadados de tabelas, facilitando a vida de atacantes ao mapear o schema de banco de dados.
**Solução:** Omissão intencional e sanitização de mensagens do Prisma. Substituição do envio bruto de falhas por mensagens mascaradas amigáveis ao usuário (ex: `"Erro interno no servidor."`). Os detalhes do log com IDs e PIIs continuam ocorrendo apenas no servidor (ex: `console.error`) mas restritamente ocultos de retornos de Actions.
**Prevenção:** Trate erros com sanitização na Borda Cliente/Servidor. A interface nunca deve conhecer a tecnologia de banco de dados usada nem suas exceções puras.

### [2026-05-29] - [SECURITY/DB] Configuração Global de RLS (Row Level Security)

**Contexto:** O banco do Supabase ficava publicamente exposto na camada da REST API via SDK, dependendo unicamente das defesas no frontend.
**Solução/Lição Aprendida:** Implementar uma trava "Zero-Trust" executando um script SQL que habilita o RLS (Row Level Security) em todas as tabelas com policies intencionalmente vazias. Isso previne manipulações diretas via cliente anônimo ou tokens forjados, forçando com que todo o acesso ocorra estritamente de maneira server-side usando o Prisma com uma `service_role` ou chave segura (backend Next.js).
**Prevenção:** Em modelos Backend-centric (Next.js App Router + Prisma), fechar 100% o RLS do Supabase é um passo fundamental para neutralizar acessos Client-Side maliciosos na porta de APIs autogeradas.

### [2026-05-29] - [SECURITY] Auditoria de Supply Chain e CVEs (Next.js)

**Contexto:** Ao iniciar o escaneamento de dependências, foram descobertas falhas estruturais associadas a versões antigas (ex: Next.js 14.1.0 propício a SSRF e Cache Poisoning).
**Solução/Lição Aprendida:** O Next.js não deve ser congelado em uma versão "minor" sem verificação (ex: fixamos agora na 14.2.35). É crucial integrar rotinas de `npm audit` em novos projetos e não manter o framework base desatualizado sob pretexto de evitar quebras. A refatoração das dependências blindou rotas nativas sem precisar de código.
**Prevenção:** Estabeleça revisões periódicas das bibliotecas críticas (Framework e ORM) para mitigar CVEs conhecidos antes do *Go-Live* de produção.

### [2026-05-29] - [ARCHITECTURE/FEATURE] Automação de E-mails (Nodemailer) via Server Actions

**Contexto:** Necessidade do orientador disparar acompanhamentos aos estagiários de forma ativa.
**Solução/Lição Aprendida:** O fluxo de mensageria foi desacoplado. As variáveis do SMTP são validadas de forma estrita em um módulo de serviço (`src/lib/email.ts`) com templates puramente funcionais (`email-templates.ts`). As Server Actions invocam este serviço seja em batch lidando com iterações sequenciais, ou individualmente, sempre garantindo o retorno de um tipo coeso `EmailActionResult` para o frontend atualizar o estado das UI via Toasts.
**Prevenção:** Separar lógica de injeção HTML de regras de negócio em Server Actions garante que os alertas por e-mail não virem gargalos no fluxo de aprovação de estágios.

### [2026-06-03] - [INFRA/EMAIL] Bloqueios de SMTP em Serverless (Vercel) e Transição para API HTTP da Brevo

**Contexto:** O envio de e-mails usando Nodemailer via SMTP do Gmail (`smtp.gmail.com`) funcionava localmente, mas em produção (Vercel) as mensagens eram bloqueadas silenciosamente pelo Google/Vercel devido à faixa de IPs de servidores compartilhados. Os e-mails do mailer padrão do Supabase também eram bloqueados por baixa reputação de IP.
**Solução:** Transição para envio por **API HTTP da Brevo** (`POST https://api.brevo.com/v3/smtp/email`) utilizando o `fetch` nativo. Lógicas híbridas em `src/lib/email.ts` detectam se `SMTP_PASS` é uma chave Brevo (`xkeysib-`) e desviam o envio para a API HTTP, mantendo o Nodemailer apenas como fallback. Requisições HTTP em serverless são mais rápidas, leves e evitam as restrições de porta e IP do SMTP clássico.
**Prevenção:** Em ambientes serverless (Vercel/Next.js), dê preferência para APIs transacionais HTTP (Brevo, Resend) em vez de conexões SMTP persistentes (Nodemailer TCP) para garantir entregabilidade.

### [2026-06-03] - [LOGIC/EMAIL] Contornando Bloqueio Institucional via E-mail Alternativo Obrigatório

**Contexto:** Os servidores de e-mail institucionais da UEMG (`@uemg.br`) rejeitam sumariamente mensagens automáticas de servidores externos, impedindo recuperação de senha e alertas. Como não é possível alterar as regras de firewall da universidade, os usuários ficavam sem comunicação.
**Solução:** Introdução de um campo **E-mail Alternativo** (`emailAlternativo`) obrigatório no modelo `Profile`. O e-mail institucional é mantido estritamente como identidade de autenticação (Supabase Auth), mas e-mails de recuperação de senha e alertas de acompanhamento são direcionados ao e-mail alternativo do usuário (pessoal, ex: Gmail). O formulário de recuperação aceita ambos os e-mails para localização do perfil, mas o link vai para o alternativo.
**Prevenção:** Em sistemas integrados a redes corporativas ou acadêmicas com firewalls de e-mail rígidos, projete o sistema desde o início separando a "Identidade de Login" (institucional) do "Canal de Comunicação" (alternativo pessoal).

### [2026-06-07] - [UX/REACT] Campos Ocultos em initialData e Falsa Impressão de Perda de Dados

**Contexto:** O painel administrativo possui formulários de edição de usuários. O campo `emailAlternativo` foi adicionado ao formulário, mas esquecido no objeto `initialData` populado pelo backend. Como o campo não vinha do servidor para a UI, o formulário o inicializava como vazio (`""`) toda vez que a tela era aberta, passando a impressão de que os dados "não ficavam gravados no banco" após a edição, quando o erro era de exibição/hidratação de dados.
**Solução:** Inclusão explícita do campo `emailAlternativo` dentro do objeto `initialData` retornado pelo servidor nas páginas de edição (`/admin/alunos/[id]/page.tsx` e congêneres).
**Prevenção:** Sempre que um novo campo for adicionado à base de dados e ao formulário de edição (Zod Schema), certifique-se de adicioná-lo também no mapeamento para o estado inicial (`initialData`) da página de carregamento.

### [2026-08-03] - [SECURITY/LOGIC] Proteção Dupla em Edição de Dados Estruturais (Período Letivo)

**Contexto:** O período letivo do aluno precisava se tornar editável para que ele acompanhasse as ofertas correspondentes ao seu semestre atual. Porém, alterar esse dado enquanto há contratos (estágios) em andamento corromperia a integridade da auditoria com o professor, configurando fraude de grade curricular.
**Solução:** Implementação de bloqueio relacional condicional duplo. No Frontend (`page.tsx` + `profile-form.tsx`), a UI busca os contratos e desabilita o campo caso exista algum com status `ATIVO` ou `PENDENTE`. Na Server Action (`actions.ts`), a mesmíssima verificação relacional é repetida antes do Prisma executar o update, para evitar *bypass* via chamadas HTTP diretas.
**Prevenção:** Em dados de "Perfil" que servem como âncora mestre para fluxos de negócio subsequentes (ex: Período, Curso, Papel), nunca libere a edição irrestrita sem validar se o usuário possui "processos abertos" dependentes dessa âncora. Sempre faça o espelhamento da trava visual do Frontend no Server-Side.

### [2026-08-23] - [SECURITY/DB] RLS Omitido em Tabelas Criadas Manualmente

**Contexto:** Uma nova tabela de logs (`log_verificacao_documento`) foi criada via script SQL manual (`executeRaw`) para evitar warnings de perda de dados do `prisma db push`. A tabela foi criada com sucesso, mas o RLS (Row Level Security) permaneceu desativado por padrão, expondo a tabela à API REST nativa do Supabase.
**Solução:** Sempre que executar um `CREATE TABLE` manual em ambientes Supabase, é obrigatório encadear o comando `ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;` imediatamente a seguir.
**Prevenção:** Inclua a habilitação do RLS no checklist mental/protocolo sempre que o Prisma não for o orquestrador exclusivo das migrations no Supabase.

### [2026-08-23] - [PERFORMANCE/DB] Múltiplas Queries Independentes em Server Components

**Contexto:** O painel de estatísticas administrativas realizava 8 consultas de agregação (counts) consecutivas usando `await` puro no Prisma, causando um aumento cumulativo no Time To First Byte (TTFB) e bloqueando o Event Loop em cada step.
**Solução:** Substituição das queries encadeadas por uma desestruturação acoplada a um `Promise.all([ query1, query2... ])`, disparando as consultas simultaneamente na thread do Prisma.
**Prevenção:** Nunca encadeie instruções `await` para requisições de banco de dados que não possuam dependência sequencial direta. Agrupe-as sempre em execução paralela.

### [2026-08-23] - [SECURITY/NEXTJS] Zero-Trust em Parâmetros de URL (Server Components)

**Contexto:** Rotas que recebem `searchParams` dinâmicos (ex: `/admin?unidade=1`) sofriam o risco de quebrar ou lançar erros de DB 500 caso o usuário inserisse strings corrompidas, visto que os parâmetros eram convertidos para Número e injetados cegamente no Prisma.
**Solução:** Adoção de interceptação com **Zod** (`z.object().safeParse`) direto na assinatura do Server Component para higienizar e neutralizar entradas maliciosas via fallback silencioso (`undefined`).
**Prevenção:** Trate as URLs e SearchParams do Next.js App Router com o mesmo rigor de segurança de uma API de mutação POST. Nunca confie nos parâmetros puros da requisição GET para queries de DB.

### [2026-08-23] - [REACT/CLEAN-CODE] Dicionários (Maps) em substituição a Ternários Aninhados

**Contexto:** Na renderização iterativa de tabelas (`contratos.map()`), a cor das "Badges" visuais dependia de múltiplos `ifs`/ternários aninhados `(status === 'X' ? 'red' : status === 'Y' ? 'blue'...)`. Isso inflacionava a complexidade ciclomática no momento do render JSX.
**Solução:** Abstração completa dos ternários para Dicionários Constantes Chave-Valor (`const STATUS_MAP = { X: 'red', Y: 'blue' }`) alocados **fora** do escopo do componente, reduzindo a renderização visual a uma busca indexada elegante e rápida (`STATUS_MAP[status]`).
**Prevenção:** Evite lógica condicional complexa dentro das instâncias de layout do React. Empregue mapas estáticos (Look-up tables) para injetar estilos ou valores computados baseados em Enumerações e Status.

### [2026-08-23] - [DB/ARCHITECTURE] Saneamento Seguro vs Integridade Referencial (Rename-in-place)

**Contexto:** O banco de dados acumulou duplicidades no `CampoEstagio` (ex: "Empresa XPTO" e "EMPRESA XPTO LTDA"). A primeira ideia seria criar um botão "Mesclar" que deletaria uma das entidades e atualizaria todos os IDs no `ContratoEstagio`.
**Solução:** 
Em sistemas com forte trilha de auditoria e geração de PDFs assinados, **deletar entidades estruturais é perigoso**. O Saneamento foi implementado via *Rename-in-place*: a UI exibe o botão "Corrigir Nome" que simplesmente faz um `UPDATE CampoEstagio SET razaoSocial = X WHERE id = Y`.
O motor de Agrupamento SQL (`groupBy` ou Mapa por upper case) cuida de aglutinar os nomes corrigidos dinamicamente, sem nunca tocar nos `ContratoEstagio` já atrelados.
**Prevenção:** Sempre planeje o saneamento de texto usando colunas desacopladas das chaves primárias. "Renomear" é seguro; "Deletar e Mudar IDs" é um pesadelo arquitetural.

### [2026-08-23] - [DB/SECURITY] Filtragem de Contexto (Context-Aware) em Buscas Globais

**Contexto:** Ao implementar o Ranking de Empresas e o Autocomplete, as queries iniciais buscavam todos os contratos de estágio (`findMany`). Em um sistema desenhado para múltiplas Unidades e Cursos (multi-tenant-like), isso gerou vazamento de escopo: alunos de um curso viam sugestões de empresas de outro curso completamente não-relacionado.
**Solução:** 
A camada de Data (`getEmpresasRanking` e `getEmpresasNomes`) foi refatorada para interceptar ativamente a sessão do usuário via `supabase.auth.getUser()`:
1. Identifica o Role do usuário.
2. Para ALUNO e PROFESSOR: Busca as relações do perfil e monta dinamicamente um `whereClause` rigoroso: `{ oferta: { curso: { cursoId: aluno.cursoId, curso: { unidadeId: aluno.curso.unidadeId } } } }`.
3. Para ADMIN: Adicionou suporte a query params (`?unidade=X&curso=Y`) controlados via interface.
**Prevenção:** Sempre que projetar endpoints ou server actions que agregam dados ("Rankings", "Listas", "Autocompletes"), assuma que o escopo deve ser restrito à hierarquia do usuário (Curso/Unidade) a menos que explicitamente solicitado como global pelo Admin.

### [2026-08-23] - [UI/UX] Autocomplete Nativo e Performático (HTML5 Datalist)

**Contexto:** O formulário do aluno precisava de um campo de Empresa que fornecesse sugestões do banco, mas não o proibisse de digitar um texto 100% livre (fallback). Componentes como Combobox/Command do Shadcn requerem muita gestão de estado e travam o layout quando usados dentro do `react-hook-form` como input misto.
**Solução:** Utilização do nativo `<input list="id">` com `<datalist>`. Isso repassa o ônus do filtro pro navegador, entregando acessibilidade e performance máxima sem adicionar um único `useState` ao componente.
### [2026-08-23] - [DATA/INTEGRITY] Saneamento Visual (Rename-in-place) vs Deleção Relacional

**Contexto:** Ocorreram cadastros de empresas duplicados (ex: "Prefeitura" e "Pref. Mun."). Fundir isso na tabela `CampoEstagio` (mudando os IDs dos `Contratos` e deletando o registro antigo) corria o risco crítico de perder dados intrínsecos de cada contrato (ex: contatos distintos do supervisor).
**Solução:** Manutenção de todos os registros na base e alteração apenas da etiqueta textual (`razaoSocial`). Como o motor analítico conta e agrupa por *texto*, a renomeação padroniza o ranking e o autocomplete sem alterar nenhuma Foreign Key.
**Prevenção:** Evite rotinas de "Merge & Delete" no banco de dados para dados periféricos já vinculados a registros imutáveis (como Contratos). Sanitize o *valor nominal* em lote e deixe as consultas de agrupamento cuidarem da fusão na interface.

### [2026-08-23] - [SECURITY/ZERO-TRUST] Falso Positivo em Filtros Globais (Bypass de Sessão)

**Contexto:** Funções criadoras de regras condicionais para o Prisma (como `buildContextualWhereClause`) inicializavam o objeto de filtro como `{}`. Se a validação do usuário ou da sessão falhasse, elas retornavam esse objeto vazio para o chamador. No Prisma, um `where: {}` equivale a buscar todos os registros irrestritamente.
**Solução:** Refatoração para `getAuthorizedContext`, adotando o padrão "Fail-Close". A função agora lança uma exceção `throw new Error("Unauthorized")` na primeira linha se o token ou o usuário não existirem, bloqueando a requisição imediatamente antes de qualquer query ser montada.
**Prevenção:** Em rotinas que delimitam escopo de busca baseado em papel (RBAC), o estado de fallback/erro deve ser sempre uma negação explícita ou uma exceção, jamais um filtro vazio tolerante.

### [2026-08-23] - [SECURITY/IDOR] Validação de Ownership em Buscas por ID (Silenciosa)

**Contexto:** Ao consultar detalhes de um recurso por URL/ID (ex: `getContratoById(id)`), a simples validação da sessão impedia acessos anônimos, mas não impedia que um Aluno A adivinhasse a URL e acessasse os dados do Aluno B (Insecure Direct Object Reference).
**Solução:** Injeção de Ownership Checks na camada de Data Fetching. Após buscar o registro no banco, o sistema cruza o `contrato.idAluno` ou `oferta.professorOrientadorId` com o Perfil logado. Caso os IDs não coincidam, a função retorna `null` **silenciosamente**.
**Prevenção:** Retornar erros genéricos (`null` ou `404`) ao invés de `403 Forbidden` mascara a existência do recurso, prevenindo ataques de enumeração. Sempre valide o "Dono do Dado" quando buscar recursos individuais.

### [2026-08-23] - [UX/DB] Filtros Globais vs Inputs Auxiliares (Autocomplete)

**Contexto:** Ao implementar o Ranking de Empresas, aplicamos um filtro estrito de `tipoDocumentacao = 'Termo de Compromisso de Estágio'` nas consultas de empresas (`campoEstagio`). Como a função `getEmpresasNomes` (usada no Autocomplete do formulário de Novo Estágio) reaproveitava essa mesma base lógica, empresas que só possuíam histórico de "Pedidos de Dispensa" deixaram de aparecer no autocomplete para o aluno preencher, abrindo margem para cadastros duplicados (erros de digitação).
**Solução:** Desacoplamos o filtro de tipo de documento exclusivamente da função `getEmpresasNomes`, permitindo listar **todas** as empresas independentemente do tipo de contrato (Termo ou Dispensa), mas mantendo rigorosamente as restrições de contexto Multi-Tenant (Curso/Unidade) para prevenir cruzamento indevido de dados de diferentes polos da UEMG (IDOR). O Ranking analítico (`getEmpresasRanking`) permaneceu com o filtro restritivo intacto.
**Prevenção:** Funções de Auto-Complete (Input Helpers) na UI não devem herdar cegamente as mesmas restrições de domínios analíticos/estatísticos (Rankings). O objetivo do Autocomplete é puramente facilitar o input e evitar poluição no banco (duplicidades) listando a maior abrangência de dados possível para o contexto de segurança atual.

### [2026-08-29] - [NEXTJS/CACHE] Route Cache Estático Bloqueando Atualização de Dados em Tempo Real

**Contexto:** Ao acessar o "Ranking de Empresas", os dados exibidos estavam defasados. Como a rota não dependia de funções dinâmicas do Next.js nativamente instanciadas na página, o framework aplicava o **Full Route Cache (Static Rendering)** por padrão. Mesmo que o banco mudasse, a página servia HTML estático de builds anteriores.
**Solução:** Injeção explícita das diretivas de desativação de cache `export const dynamic = "force-dynamic"` e `export const revalidate = 0` nos arquivos `page.tsx`. Isso força o Next.js a usar Server-Side Rendering (SSR) e reexecutar a query no Prisma a cada request.
**Prevenção:** Em rotas de Next.js (App Router) que agregam dados dinâmicos de negócio (Dashboards, Rankings, Relatórios), nunca confie na inferência de cache do framework caso a rota não possua *searchParams* obrigatórios ou leitura explícita de cookies no topo. Sempre declare sua intenção de renderização dinamicamente.

### [2026-08-29] - [SECURITY/LOGIC] Duplicidade de Contexto na Camada de Dados (Global vs Pessoal)

**Contexto:** A função `getAuthorizedContext` possuía uma trava de segurança que isolava dados do Professor apenas aos alunos onde ele figurava como `professorOrientadorId`. Essa trava era vital para sua Dashboard, mas corrompeu rotas globais como o "Ranking de Empresas", fazendo com que o professor visse apenas o seu próprio histórico, contrariando a premissa de um ranking geral do curso.
**Solução:** Introdução de um parâmetro arquitetural `isGlobalContext: boolean`. Quando invocado para gerar estatísticas gerais, esse parâmetro permite à camada de autorização saltar o bloqueio de "Dono" (`professorOrientadorId`) e aplicar o mesmo escopo restritivo (mas cooperativo) do Multi-Tenant padrão: `{ cursoId, unidadeId }`.
**Prevenção:** Ao desenvolver módulos de segurança que injetam `whereClauses` universais, sempre defina claramente se a transação atual exige o **Escopo Pessoal** (ex: ver notas dos MEUS alunos) ou **Escopo Operacional/Global** (ex: ver estatísticas do NOSSO curso). O mesmo ator (Role) pode atuar em ambos dependendo da rota.

### [2026-08-29] - [DB/DATA] Normalização de Strings em Memória para Agrupamentos Resilientes

**Contexto:** No banco de dados, o acúmulo orgânico gerou registros como `"INFOCLICK INFORMATICA LTDA - ME"` e `"INFOCLICK INFORMATICA LTDA-ME"`. Por causa da diferença de um único espaço em branco ou caractere especial, o comando de agrupamento as enxergava como empresas distintas, fragmentando o Ranking de estágios.
**Solução:** Implementação de uma rotina de higienização agressiva de strings na construção da chave do dicionário (`Map`) no momento da totalização.
`razao.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "")`
Isso retira toda a acentuação, espaços e pontuação (`ACAO` = `AÇÃO`). A chave de agrupamento se torna super-resiliente (`INFOCLICKINFORMATICALTDAME`), enquanto o sistema preserva para exibição (display name) a variação textual mais longa e formatada que encontrar na iteração.
**Prevenção:** Agrupamentos estatísticos baseados em texto digitado por usuários **nunca** devem depender apenas de um `toUpperCase()`. Utilize chaves de agrupamento higienizadas via Regex (strip non-alphanumerics) na camada Node.js, contornando as limitações do SQL tradicional e salvando o trabalho manual da equipe de dados.
