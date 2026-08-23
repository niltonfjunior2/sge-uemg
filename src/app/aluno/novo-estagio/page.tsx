import { getInformacoesGerais } from "@/features/estagio/data"
import { getEmpresasNomes } from "@/features/estagio/data"
import { NovoEstagioForm } from "./form"
import { createClient } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function NovoEstagioPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const aluno = await prisma.aluno.findUnique({
        where: { profileId: user.id }
    })

    if (!aluno) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Perfil de Aluno não encontrado</h1>
                <p className="text-muted-foreground mt-2">
                    Por favor, entre em contato com a secretaria para regularizar seu cadastro.
                </p>
            </div>
        )
    }

    const ofertas = await prisma.ofertaEstagio.findMany({
        where: {
            ativo: true,
            curso: {
                periodoVinculado: aluno.periodoAtual
            }
        },
        include: {
            curso: true,
            professor: {
                include: {
                    profile: true
                }
            }
        }
    })

    if (!ofertas || ofertas.length === 0) {
        return (
            <div className="p-8 text-center max-w-2xl mx-auto mt-10 border rounded-lg bg-muted/20">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Nenhuma oferta de estágio disponível</h1>
                <p className="text-muted-foreground mb-6">
                    Não foi encontrado nenhum Estágio Obrigatório ativo para o seu período atual<br />({aluno.periodoAtual}º Período).
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                    Entre em contato com a coordenação do curso ou aguarde a abertura do processo.
                </p>
                <div className="flex justify-center">
                    <a href="/aluno" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                        Voltar para Dashboard
                    </a>
                </div>
            </div>
        )
    }

    // Extract unique courses available from the offers
    // Use a Map to deduplicate by curso.id
    const cursosMap = new Map()
    ofertas.forEach(offer => {
        if (!cursosMap.has(offer.curso.id)) {
            cursosMap.set(offer.curso.id, offer.curso)
        }
    })
    const cursosDisponiveis = Array.from(cursosMap.values())

    const informacoesGerais = await getInformacoesGerais()
    const empresasNomes = await getEmpresasNomes()

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Iniciar Novo Estágio</h1>
                <p className="text-muted-foreground">
                    Preencha os dados abaixo para enviar a identificação do seu estágio.
                </p>
            </div>

            <NovoEstagioForm
                informacoesGerais={informacoesGerais}
                ofertas={ofertas}
                empresasNomes={empresasNomes}
            />
        </div>
    )
}
