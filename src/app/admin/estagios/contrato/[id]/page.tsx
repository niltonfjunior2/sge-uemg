import { getContratoById, getDiarioAtividades } from "@/features/estagio/data"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Stepper } from "@/components/ui/stepper"
import { CheckCircle, XCircle, ExternalLink, FileText, ChevronLeft, FileClock, MessageSquareWarning } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ApproveDialog } from "../../approve-dialog"
import { RejectDialog } from "../../reject-dialog"

import { ContractActions } from "../../[id]/contract-actions"
import { CompleteStageButton } from "../../[id]/complete-stage-button"
import { NotifyProblemDialog } from "../../[id]/notify-problem-dialog"
import { RevertStageButton } from "@/app/admin/estagios/revert-stage-button"
import { SendAlertButton } from "../../components/send-alert-button"

export default async function EstagioDetailsPage({ params }: { params: { id: string } }) {
    const id = parseInt(params.id)
    if (isNaN(id)) return notFound()

    const contrato = await getContratoById(id)
    if (!contrato) return notFound()

    // Current Step Logic
    const sortedAcompanhamentos = [...contrato.acompanhamentos].sort((a, b) => a.etapaDef.numeroEtapa - b.etapaDef.numeroEtapa)
    const firstPending = sortedAcompanhamentos.find(a => a.status === 'PENDENTE' || a.status === 'EM_ANALISE' || a.status === 'REJEITADO')
    const totalSteps = sortedAcompanhamentos.length

    // If there is a pending stage, use its number.
    // If NOT (all approved), current step is Total + 1 to mark all as completed.
    const currentStepId = firstPending ? firstPending.etapaDef.numeroEtapa : (totalSteps + 1)
    const isEmAnalise = firstPending?.status === 'EM_ANALISE'

    // Fetch Diary Entries (for Step 4 display)
    const diaryEntries = await getDiarioAtividades(id)
    const totalHoras = diaryEntries.reduce((acc, curr) => acc + curr.horasRealizadas, 0)

    const hasCompletedStages = contrato.acompanhamentos.some((a: any) => a.status === 'ATIVO')
    const canRevert = hasCompletedStages || (firstPending && firstPending.status !== 'ATIVO')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{contrato.aluno.profile.nomeCompleto}</h1>
                    <p className="text-muted-foreground mr-4 inline-block">
                        {contrato.oferta?.curso?.nome} - {contrato.oferta?.curso?.curso?.nome} - {contrato.oferta?.curso?.curso?.unidade?.nome}
                    </p>
                    <Badge variant="outline">{contrato.aluno.matricula}</Badge>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <SendAlertButton type="single" targetId={contrato.id} variant="outline" />
                    <Badge variant={contrato.statusAprovacao === 'ATIVO' ? 'success' : 'secondary'}>
                        {contrato.statusAprovacao}
                    </Badge>
                    <ContractActions 
                        contractId={contrato.id} 
                        status={contrato.statusAprovacao || 'PENDENTE'} 
                        currentStepId={currentStepId}
                    />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados do Estágio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm">Empresa / Concedente</h4>
                                <p className="text-muted-foreground">{contrato.campo.nomeFantasia}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-sm">Modalidade</h4>
                                    <p className="text-muted-foreground">{contrato.modalidade}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Carga Horária</h4>
                                    <p className="text-muted-foreground">{contrato.cargaHorariaDiaria}h / dia</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Tipo de Documentação</h4>
                                <p className="text-muted-foreground">
                                    {contrato.tipoDocumentacao === 'TCE' ? 'Termo de Compromisso (TCE)' : contrato.tipoDocumentacao}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Supervisor</h4>
                                <p className="text-muted-foreground">{contrato.campo.supervisorNome} ({contrato.campo.supervisorCargo})</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-sm">Data de Início</h4>
                                    <p className="text-muted-foreground">{format(contrato.dataInicioPrevista, "PPP", { locale: ptBR })}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Previsão de Término</h4>
                                    <p className="text-muted-foreground">{contrato.dataConclusaoEstagio ? format(contrato.dataConclusaoEstagio, "PPP", { locale: ptBR }) : "Em aberto"}</p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold text-sm">Atribuições</h4>
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{contrato.atribuicoes}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Progress & Actions */}
                <div className="space-y-6">
                    {/* Stepper Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Progresso</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Stepper
                                currentStep={currentStepId}
                                steps={contrato.acompanhamentos.map(a => ({
                                    id: a.etapaDef.numeroEtapa,
                                    label: a.etapaDef.numeroEtapa.toString()
                                }))}
                            />
                        </CardContent>
                    </Card>

                    {/* Notification History Card */}
                    {contrato.acompanhamentos.some((a: any) => a.observacoes) && (
                        <Card className="border-amber-200 bg-amber-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MessageSquareWarning className="h-5 w-5 text-amber-600" />
                                    Histórico de Notificações
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {contrato.acompanhamentos
                                    .filter((a: any) => a.observacoes)
                                    .map((a: any) => (
                                        <div key={a.id} className="bg-white p-3 rounded-md border border-amber-100 shadow-sm text-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-amber-800">
                                                    Etapa {a.etapaDef.numeroEtapa}: {a.etapaDef.descricao}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {a.updatedAt ? format(new Date(a.updatedAt), "dd/MM/yyyy") : "-"}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 italic">
                                                "{a.observacoes}"
                                            </p>
                                        </div>
                                    ))
                                }
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Card */}
                    {contrato.statusAprovacao === 'PENDENTE' ? (
                        <Card className="border-yellow-200 bg-yellow-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-800">
                                    <FileClock className="h-5 w-5" />
                                    Aguardando Início
                                </CardTitle>
                                <CardDescription className="text-yellow-700">
                                    Este estágio aguarda sua aprovação para iniciar.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-yellow-800">
                                Verifique os dados e utilize o botão "Aprovar" no topo da página para iniciar o acompanhamento das etapas.
                            </CardContent>
                        </Card>
                    ) : firstPending ? (
                        <Card className={isEmAnalise ? "border-primary" : ""}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    ORIENTAÇÃO APRESENTADA PARA O ALUNO:<br /><br />
                                    Etapa Atual: {firstPending.etapaDef.descricao}
                                    {isEmAnalise && <Badge>Em Análise</Badge>}
                                </CardTitle>
                                <CardDescription>
                                    {firstPending.etapaDef.orientacaoTextual}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {firstPending.linkDocumento && (
                                    <div className="p-4 bg-muted rounded-md flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm font-medium">Documento enviado</span>
                                        </div>
                                        <a href={firstPending.linkDocumento} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Abrir Link
                                            </Button>
                                        </a>
                                    </div>
                                )}
                                {firstPending.idEtapaDef === 6 && contrato.textoRelatorioAvaliacao && ( // Assuming ID 6 is Relatorio
                                    <div className="p-4 bg-muted rounded-md space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm font-medium">Relatório de Avaliação</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground italic p-2 border-l-2 bg-background">
                                            {contrato.textoRelatorioAvaliacao}
                                        </p>
                                    </div>
                                )}

                                {firstPending.etapaDef.numeroEtapa === 4 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold">Atividades Registradas</h4>
                                            <Badge variant="outline">Total: {totalHoras}h</Badge>
                                        </div>

                                        {diaryEntries.length === 0 ? (
                                            <div className="text-sm text-muted-foreground italic">Nenhuma atividade registrada.</div>
                                        ) : (
                                            <div className="rounded-md border text-sm overflow-x-auto">
                                                <table className="w-full min-w-[500px]">
                                                    <thead className="bg-muted">
                                                        <tr className="text-left">
                                                            <th className="p-2 font-medium">Data</th>
                                                            <th className="p-2 font-medium">Horas</th>
                                                            <th className="p-2 font-medium">Descrição</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {diaryEntries.map((entry) => (
                                                            <tr key={entry.id} className="border-t">
                                                                <td className="p-2">{format(entry.dataAtividade, "dd/MM/yyyy")}</td>
                                                                <td className="p-2">{entry.horasRealizadas}h</td>
                                                                <td className="p-2 text-muted-foreground">{entry.descricaoAtividades}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isEmAnalise && (
                                    <div className="space-y-4 py-4">
                                        <div className="text-center text-sm text-muted-foreground">
                                            Etapa em andamento pelo aluno.
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <CompleteStageButton acompanhamentoId={firstPending.id} />
                                            <RevertStageButton contratoId={contrato.id} disabled={!canRevert} />
                                            <NotifyProblemDialog
                                                contratoId={contrato.id}
                                                etapaId={firstPending.etapaDef.id}
                                                etapaNome={firstPending.etapaDef.descricao}
                                            />
                                        </div>
                                    </div>
                                )}

                                {isEmAnalise && (
                                    <div className="space-y-4 pt-4">
                                        <div className="flex gap-4">
                                            <ApproveDialog
                                                contratoId={contrato.id}
                                                etapaId={firstPending.etapaDef.id} // Note: This passes the ID of Def, ensure action expects this
                                                etapaNome={firstPending.etapaDef.descricao}
                                            />
                                            <RejectDialog
                                                contratoId={contrato.id}
                                                etapaId={firstPending.etapaDef.id}
                                                etapaNome={firstPending.etapaDef.descricao}
                                            />
                                        </div>
                                        <RevertStageButton contratoId={contrato.id} disabled={!canRevert} className="w-full" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="py-6 flex flex-col items-center text-center text-green-800">
                                <CheckCircle className="h-12 w-12 mb-4 text-green-600" />
                                <h3 className="text-xl font-bold">Estágio Concluído!</h3>
                                <p className="mb-4">Todas as etapas foram aprovadas.</p>
                                <RevertStageButton contratoId={contrato.id} disabled={!hasCompletedStages} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
