import { getEmpresasRanking } from "@/features/estagio/data"
import { RankingTable } from "@/features/estagio/components/ranking-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"

export default async function AdminRankingPage() {
    const ranking = await getEmpresasRanking()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ranking de Empresas</h1>
                <p className="text-muted-foreground">Visão geral das empresas parceiras que mais oferecem estágios.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Tabela Completa de Empresas
                    </CardTitle>
                    <CardDescription>
                        Ranking histórico vitalício de todas as empresas registradas no sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RankingTable ranking={ranking} />
                </CardContent>
            </Card>
        </div>
    )
}
