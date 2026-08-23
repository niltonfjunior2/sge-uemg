const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.log_verificacao_documento (
      id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
      codigo_verificado character varying NOT NULL,
      tipo_documento character varying NOT NULL,
      data_verificacao timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
      CONSTRAINT log_verificacao_documento_pkey PRIMARY KEY (id)
    );
  `);
  console.log("Tabela criada com sucesso!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
