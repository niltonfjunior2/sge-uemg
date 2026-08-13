"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileClock, CheckCircle2, AlertCircle, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { SendAlertButton } from "./estagios/components/send-alert-button"
import { EncerrarOrientacaoDialog } from "@/features/estagio/components/encerrar-orientacao-dialog"
import { FileDown, Ban } from "lucide-react"

interface ProfessorDashboardClientProps {
    contratos: any[]
    ofertas: any[]
}

export function ProfessorDashboardClient({ contratos: initialContratos, ofertas }: ProfessorDashboardClientProps) {
    const [selectedOfertaId, setSelectedOfertaId] = useState<number | null>(null)

    // Filter contracts based on selection
    const filteredContratos = (selectedOfertaId
        ? initialContratos.filter(c => c.oferta?.id === selectedOfertaId && c.oferta?.ativo !== false)
        : initialContratos.filter(c => c.oferta?.ativo !== false)
    ).sort((a, b) => {
            const nameA = a.aluno?.profile?.nomeCompleto || "";
            const nameB = b.aluno?.profile?.nomeCompleto || "";
            return nameA.localeCompare(nameB);
        });

    // Calculate stats based on filtered contracts
    const pendentes = filteredContratos.filter(c => c.statusAprovacao === 'PENDENTE').length
    const ativos = filteredContratos.filter(c => c.statusAprovacao === 'ATIVO' && !c.dataConclusaoEstagio).length
    const alertas = filteredContratos.filter(c => c.acompanhamentos.some((a: any) => a.status === 'REJEITADO')).length

    const handleOfertaClick = (ofertaId: number) => {
        if (selectedOfertaId === ofertaId) {
            setSelectedOfertaId(null) // Deselect
        } else {
            setSelectedOfertaId(ofertaId) // Select
        }
    }

    return (
        <div className="space-y-6">
            {/* Cards de Ofertas (Atribuições) */}
            {ofertas && ofertas.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-muted-foreground" />
                            Minhas Orientações
                        </h2>
                        <SendAlertButton type="bulk" targetId={selectedOfertaId} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {ofertas.map((oferta: any) => {
                            const isSelected = selectedOfertaId === oferta.id
                            return (
                                <Card
                                    key={oferta.id}
                                    className={cn(
                                        "transition-all duration-200 border-l-4 shadow-sm",
                                        oferta.ativo !== false ? "cursor-pointer hover:shadow-md" : "opacity-80",
                                        isSelected
                                            ? "border-l-primary ring-2 ring-primary ring-offset-2 bg-primary/5"
                                            : oferta.ativo === false ? "border-l-gray-400 bg-muted/20" : "border-l-yellow-500 bg-muted/40 hover:bg-muted/60"
                                    )}
                                    onClick={() => oferta.ativo !== false && handleOfertaClick(oferta.id)}
                                >
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-bold">
                                            {oferta.curso.nome}
                                            <span className="block text-sm font-normal text-muted-foreground">
                                                {oferta.curso.curso?.nome} - {oferta.curso.curso?.unidade?.nome}
                                            </span>
                                        </CardTitle>
                                        <CardDescription className="flex flex-col gap-1">
                                            <span>Semestre: {oferta.semestreLetivo}</span>
                                            <span className="font-medium text-foreground/80">{oferta.curso.periodoVinculado}º Período</span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-2">Vínculo de Orientação Ativo</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                                            {oferta.ativo === false ? (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <span className="flex items-center gap-1 text-red-600 font-medium">
                                                        <Ban className="h-3 w-3" /> Orientação Encerrada
                                                    </span>
                                                    <Link href={`/api/relatorios/encerramento-turma/${oferta.id}`} target="_blank">
                                                        <Button variant="outline" size="sm" className="w-full text-xs h-8">
                                                            <FileDown className="mr-2 h-3 w-3" />
                                                            Baixar Relatório (PDF)
                                                        </Button>
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                        {isSelected ? "Selecionado" : "Clique para filtrar"}
                                                    </span>
                                                    <EncerrarOrientacaoDialog ofertaId={oferta.id} disabled={!isSelected} />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Stats Cards (Dynamic) */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendentes de Aprovação</CardTitle>
                        <FileClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendentes}</div>
                        <p className="text-xs text-muted-foreground">Aguardando ação</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estágios Ativos</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ativos}</div>
                        <p className="text-xs text-muted-foreground">Em andamento</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas/Rejeitados</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{alertas}</div>
                        <p className="text-xs text-muted-foreground">Requer atenção</p>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de Alunos (Dynamic) */}
            {filteredContratos.length > 0 ? (
                <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Aluno</th>
                                <th className="px-4 py-3">Matrícula</th>
                                <th className="px-4 py-3">Estágio / Curso</th>
                                <th className="px-4 py-3 text-center">Etapa Atual</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredContratos.map((contrato) => {
                                const currentStepDef = contrato.acompanhamentos.find((a: any) => 
                                    a.status === 'PENDENTE' || a.status === 'EM_ANALISE' || a.status === 'REJEITADO'
                                )
                                const currentStepLabel = currentStepDef 
                                    ? `Etapa ${currentStepDef.etapaDef.numeroEtapa}` 
                                    : "Concluído"
                                const currentStepStatus = currentStepDef ? currentStepDef.status : "CONCLUIDO"

                                return (
                                    <tr key={contrato.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {contrato.aluno.profile.nomeCompleto}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-muted-foreground">
                                            {contrato.aluno.matricula}
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px] truncate" title={`${contrato.oferta?.curso?.nome} - ${contrato.campo.nomeFantasia}`}>
                                            <div className="font-medium text-foreground">{contrato.oferta?.curso?.nome}</div>
                                            <div className="text-xs text-muted-foreground truncate flex flex-col">
                                                <span>{contrato.oferta?.curso?.curso?.nome} - {contrato.oferta?.curso?.curso?.unidade?.nome}</span>
                                                <span className="font-semibold">{contrato.tipoDocumentacao}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xs font-semibold text-foreground">
                                                    {currentStepLabel}
                                                </span>
                                                {currentStepDef && currentStepStatus !== 'PENDENTE' && (
                                                    <Badge variant={
                                                        currentStepStatus === 'EM_ANALISE' ? 'secondary' :
                                                            currentStepStatus === 'REJEITADO' ? 'destructive' : 'outline'
                                                    } className="text-[10px] px-1.5 h-4 w-fit">
                                                        {currentStepStatus}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {(() => {
                                                const isLate = currentStepDef?.dataLimite && new Date() > new Date(currentStepDef.dataLimite)

                                                return (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Badge variant={contrato.statusAprovacao === 'ATIVO' ? 'success' : contrato.statusAprovacao === 'REJEITADO' ? 'destructive' : 'secondary'}>
                                                            {contrato.statusAprovacao}
                                                        </Badge>
                                                        {isLate && contrato.statusAprovacao === 'ATIVO' && (
                                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded border border-red-200">
                                                                ATRASADO
                                                            </span>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/estagios/contrato/${contrato.id}`}>
                                                <Button size="sm" variant="outline" className="h-8">
                                                    Acessar
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                    <p className="text-muted-foreground">Nenhum estágio encontrado para esta seleção.</p>
                </div>
            )}
        </div>
    )
}
