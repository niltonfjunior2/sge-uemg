'use client'

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteContractAction, updateContractStatusAction } from "@/features/estagio/actions"
import { Trash2, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContractActionsProps {
    contractId: number
    status: string // 'PENDENTE' | 'APROVADO' | 'REJEITADO'
    currentStepId: number
}

export function ContractActions({ contractId, status, currentStepId }: ContractActionsProps) {
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()
    const router = useRouter()

    const handleActivate = () => {
        startTransition(async () => {
            const result = await updateContractStatusAction(contractId, 'ATIVO')
            if (result.success) {
                toast({
                    title: "Status Atualizado",
                    description: "O estágio foi marcado como ATIVO (Aprovado).",
                })
                router.refresh()
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: result.error,
                })
            }
        })
    }

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteContractAction(contractId)
            if (result.success) {
                toast({
                    title: "Contrato Liquldado",
                    description: "O registro de estágio foi excluído permanentemente.",
                })
                router.push('/admin') // Redirect to dashboard
                router.refresh()
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: result.error,
                })
            }
        })
    }

    return (
        <div className="flex gap-2">
            {status === 'PENDENTE' && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Tornar Ativo
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Ativação</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja alterar o status deste estágio para <strong>ATIVO</strong>?<br />
                                Isso indicará que o aluno está apto a iniciar ou continuar as atividades.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleActivate} className="bg-green-600 hover:bg-green-700">
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {currentStepId === 1 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Estágio?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o contrato de estágio,
                                os dados submetidos na primeira etapa e eventuais rascunhos de atividades. Não será possível recuperar esses dados.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, Excluir"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    )
}
