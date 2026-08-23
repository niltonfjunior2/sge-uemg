"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface ContratoTableProps {
    contratos: any[]
}

const PENDING_STATUSES = ['PENDENTE', 'EM_ANALISE', 'REJEITADO'];
const STATUS_BADGE_MAP: Record<string, any> = {
    EM_ANALISE: 'secondary',
    REJEITADO: 'destructive',
    PENDENTE: 'outline'
};
const FINAL_STATUS_MAP: Record<string, any> = {
    ATIVO: 'success',
    ENCERRADO: 'outline'
};

export function ContratoTable({ contratos }: ContratoTableProps) {
    if (contratos.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Nenhum estágio encontrado.</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Estagiário</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Etapa Atual</TableHead>
                        <TableHead>Status Final</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contratos.map((contrato) => {
                        const firstPending = contrato.acompanhamentos.find((a: any) =>
                            PENDING_STATUSES.includes(a.status)
                        )
                        const currentStep = firstPending
                            ? `Etapa ${firstPending.etapaDef.numeroEtapa}`
                            : "Concluído"
                        const currentStatus = firstPending ? firstPending.status : "CONCLUIDO"

                        return (
                            <TableRow key={contrato.id}>
                                <TableCell className="font-medium">
                                    {contrato.aluno.profile.nomeCompleto}
                                    <div className="text-xs text-muted-foreground">{contrato.aluno.matricula}</div>
                                </TableCell>
                                <TableCell>{contrato.campo.nomeFantasia}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className="text-sm font-medium">{currentStep}</span>
                                        {firstPending && currentStatus !== 'PENDENTE' && (
                                            <Badge variant={STATUS_BADGE_MAP[currentStatus] || 'outline'} className="w-fit text-[10px] px-2 h-5">
                                                {currentStatus}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={FINAL_STATUS_MAP[contrato.statusAprovacao] || 'secondary'}>
                                        {contrato.statusAprovacao}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/admin/estagios/contrato/${contrato.id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
