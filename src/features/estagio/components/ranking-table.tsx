"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Building2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { corrigirNomeEmpresa } from "@/features/estagio/actions"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface RankingItem {
    razaoSocial: string;
    totalEstagios: number;
    ultimoPeriodo: string;
}

interface RankingTableProps {
    ranking: RankingItem[];
    isAdmin?: boolean;
}

export function RankingTable({ ranking, isAdmin = false }: RankingTableProps) {
    const { toast } = useToast()
    const [editingCompany, setEditingCompany] = useState<string | null>(null)
    const [newName, setNewName] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const handleEditClick = (name: string) => {
        setEditingCompany(name)
        setNewName(name)
    }

    const handleSave = async () => {
        if (!editingCompany || !newName || editingCompany === newName) {
            setEditingCompany(null)
            return
        }

        setIsSaving(true)
        const result = await corrigirNomeEmpresa(editingCompany, newName)
        
        if (result.success) {
            toast({
                title: "Empresas Atualizadas",
                description: `Foram atualizados ${result.count} registros vinculados com sucesso!`,
            })
            setEditingCompany(null)
        } else {
            toast({
                title: "Erro ao atualizar",
                description: result.error || "Ocorreu um erro inesperado.",
                variant: "destructive",
            })
        }
        setIsSaving(false)
    }

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
                        {isAdmin && <TableHead className="w-20 text-center">Ações</TableHead>}
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
                                {isAdmin && (
                                    <TableCell className="text-center">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleEditClick(empresa.razaoSocial)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renomear Empresa Parceira</DialogTitle>
                        <DialogDescription>
                            Atenção: Ao renomear, todos os registros antigos vinculados ao nome <b>{editingCompany}</b> serão atualizados para o novo nome. Isso unificará as duplicidades.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Digite o nome padronizado" 
                            disabled={isSaving}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCompany(null)} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSaving || !newName || newName === editingCompany}>
                            {isSaving ? "Salvando..." : "Salvar e Unificar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
