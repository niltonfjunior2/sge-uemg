import { createClient } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AlunoSidebar } from "@/components/layout/aluno-sidebar"

export default async function AlunoLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userName = "Aluno"
    let hasActiveInternship = false

    if (user) {
        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            include: {
                aluno: {
                    include: {
                        contratos: {
                            where: {
                                statusAprovacao: 'ATIVO',
                                dataConclusaoEstagio: null
                            }
                        }
                    }
                }
            }
        })

        if (profile) {
            userName = profile.nomeCompleto
            if (profile.aluno && profile.aluno.contratos.length > 0) {
                hasActiveInternship = true
            }
        }
    }

    return (
        <div className="flex h-screen w-full flex-col md:flex-row">
            <AlunoSidebar userName={userName} hasActiveInternship={hasActiveInternship} />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
                {children}
            </main>
        </div>
    )
}
