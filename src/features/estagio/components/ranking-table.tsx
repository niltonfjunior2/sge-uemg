import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Building2 } from "lucide-react"

interface RankingItem {
    razaoSocial: string;
    totalEstagios: number;
    ultimoPeriodo: string;
}

export function RankingTable({ ranking }: { ranking: RankingItem[] }) {
    if (ranking.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Nenhuma empresa parceira encontrada.</div>
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16 text-center">Posição</TableHead>
                        <TableHead>Empresa Parceira</TableHead>
                        <TableHead className="text-center">Total de Estágios</TableHead>
                        <TableHead className="text-right">Último Período</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ranking.map((empresa, index) => {
                        let positionBadge = <span className="font-medium">{index + 1}º</span>;
                        
                        if (index === 0) {
                            positionBadge = <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />;
                        } else if (index === 1) {
                            positionBadge = <Medal className="h-5 w-5 text-gray-400 mx-auto" />;
                        } else if (index === 2) {
                            positionBadge = <Medal className="h-5 w-5 text-amber-700 mx-auto" />;
                        }

                        return (
                            <TableRow key={index} className="group">
                                <TableCell className="text-center">
                                    {positionBadge}
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        {empresa.razaoSocial}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary" className="text-sm">
                                        {empresa.totalEstagios}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                    {empresa.ultimoPeriodo}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
