import { getEmpresasRanking, getFiltrosData } from "@/features/estagio/data"
import { RankingTable } from "@/features/estagio/components/ranking-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import { DashboardFilters } from "@/app/admin/dashboard-filters"

export default async function AdminRankingPage({
    searchParams,
}: {
    searchParams: { unidade?: string; curso?: string }
}) {
    const filtroUnidadeId = searchParams.unidade && searchParams.unidade !== "all" ? Number(searchParams.unidade) : undefined;
    const filtroCursoId = searchParams.curso && searchParams.curso !== "all" ? Number(searchParams.curso) : undefined;

    const ranking = await getEmpresasRanking(filtroUnidadeId, filtroCursoId)
    const { unidades, cursos } = await getFiltrosData()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ranking de Empresas</h1>
                <p className="text-muted-foreground">Visão geral das empresas parceiras que mais oferecem estágios.</p>
            </div>

            <DashboardFilters unidades={unidades} cursos={cursos} />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Tabela Completa de Empresas
                    </CardTitle>
                    <CardDescription>
                        Ranking histórico de todas as empresas registradas no sistema (com base nos filtros selecionados).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RankingTable ranking={ranking} isAdmin={true} />
                </CardContent>
            </Card>
        </div>
    )
}
