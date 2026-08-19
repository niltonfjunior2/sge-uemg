"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { logAtividade, deleteAtividade } from "@/features/estagio/actions"

import { ConfirmActivitiesDialog } from "./confirm-activities-dialog"

interface DiarioClientProps {
    contratoId: number
    initialEntries: any[]
    etapaId: number
    canSubmit: boolean
    minDate?: Date
    maxDate?: Date
    maxHours?: number
    totalRequired?: number
    dataLimite?: Date
    feriados?: any[] // Full holiday objects
}

export function DiarioClient({ contratoId, initialEntries, etapaId, canSubmit, minDate, maxDate, maxHours = 6, totalRequired = 0, dataLimite, feriados = [] }: DiarioClientProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [horas, setHoras] = useState<string>("4")
    const [descricao, setDescricao] = useState("")
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()

    // Calculate total hours
    const totalHoras = initialEntries.reduce((acc, curr) => acc + curr.horasRealizadas, 0)

    async function handleSave() {
        if (!date || !horas || !descricao) {
            toast({ title: "Preencha todos os campos", variant: "destructive" })
            return
        }

        const h = parseInt(horas)
        if (isNaN(h)) {
            toast({ title: "Horas inválidas", variant: "destructive" })
            return
        }

        startTransition(async () => {
            const res = await logAtividade(contratoId, date, h, descricao)
            if ('error' in res && res.error) {
                toast({ title: "Erro", description: res.error, variant: "destructive" })
            } else {
                toast({ title: "Atividade registrada", variant: "default" })
                setDescricao("")
            }
        })
    }

    // Helper to fix timezone for display
    const fixDate = (dateStr: string | Date) => {
        const d = new Date(dateStr)
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    }

    async function handleDelete(id: number) {
        if (!confirm("Tem certeza?")) return
        startTransition(async () => {
            await deleteAtividade(id)
            toast({ title: "Removido", description: "Atividade removida." })
        })
    }

    return (
        <div className="grid gap-6 md:grid-cols-12">
            {/* Left Column: Form + Holidays */}
            <div className="md:col-span-12 lg:col-span-5 space-y-6">
                {/* Form Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Registrar Atividade</CardTitle>
                        <CardDescription>Selecione a data e descreva as atividades.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                locale={ptBR}
                                className="rounded-md border"
                                disabled={(date) => {
                                    // Rule: "All dates AFTER release date are free, EXCEPT weekends and holidays"

                                    // Block weekends
                                    if (date.getDay() === 0 || date.getDay() === 6) return true

                                    // Block before minDate (Release Date)
                                    if (minDate && date < minDate) {
                                        const d = new Date(date)
                                        d.setHours(0, 0, 0, 0)
                                        const m = new Date(minDate)
                                        m.setHours(0, 0, 0, 0)
                                        if (d < m) return true
                                    }

                                    // Block after maxDate (Offer End Date)
                                    if (maxDate && date > maxDate) {
                                        const d = new Date(date)
                                        d.setHours(0, 0, 0, 0)
                                        const m = new Date(maxDate)
                                        m.setHours(0, 0, 0, 0)
                                        if (d > m) return true
                                    }

                                    // Block holidays
                                    const dateStr = format(date, "yyyy-MM-dd")
                                    const isHoliday = feriados.some(h => format(new Date(h.data), "yyyy-MM-dd") === dateStr)
                                    if (isHoliday) return true

                                    return false
                                }}
                                modifiers={{
                                    holiday: (date) => feriados.some(h => format(new Date(h.data), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")),
                                    weekend: (date) => date.getDay() === 0 || date.getDay() === 6
                                }}
                                modifiersStyles={{
                                    holiday: { color: 'red', fontWeight: 'bold', textDecoration: 'line-through' },
                                    weekend: { color: 'gray' }
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Horas Realizadas</label>
                            <Input
                                type="number"
                                min={1}
                                max={maxHours}
                                value={horas}
                                onChange={e => {
                                    const val = parseInt(e.target.value)
                                    setHoras(e.target.value)
                                }}
                                disabled={totalRequired > 0 && totalHoras >= totalRequired}
                            />
                            <p className="text-xs text-muted-foreground">Mínimo 1h, Máximo {maxHours}h diárias.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descrição das Atividades</label>
                            <Textarea
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                placeholder={totalRequired > 0 && totalHoras >= totalRequired ? "Carga horária total atingida." : "Descreva o que foi realizado..."}
                                rows={4}
                                disabled={totalRequired > 0 && totalHoras >= totalRequired}
                            />
                        </div>

                        <Button onClick={handleSave} className="w-full" disabled={isPending || !date || (totalRequired > 0 && totalHoras >= totalRequired)}>
                            {isPending ? "Salvando..." : (totalRequired > 0 && totalHoras >= totalRequired ? "Carga Horária Completa" : "Registrar Atividade")}
                        </Button>
                    </CardContent>
                </Card>

                {/* Holiday List Card */}
                {feriados.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Feriados e Recessos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto text-sm">
                                {feriados.map((f: any) => (
                                    <div key={f.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                        <span className="text-muted-foreground">{format(fixDate(f.data), "dd/MM/yyyy")}</span>
                                        <span className="font-medium text-right">{f.descricao}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* List Section (Right Column) */}
            <div className="md:col-span-12 lg:col-span-7 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span>Plano de Atividades</span>
                                {/* Only show PDF button if Total Required is met */}
                                {totalRequired > 0 && totalHoras >= totalRequired && (
                                    <Button
                                        size="sm"
                                        className="gap-2 bg-blue-600 text-white hover:bg-blue-800 border-none"
                                        onClick={() => window.open(`/aluno/diario/${contratoId}/pdf`, '_blank')}
                                    >
                                        <Save className="w-4 h-4" />
                                        GERAR PDF
                                    </Button>
                                )}
                            </div>
                            <span className={`text-sm font-normal px-3 py-1 rounded-full ${totalRequired > 0
                                ? (totalHoras >= totalRequired ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200')
                                : 'bg-secondary/10 text-secondary'
                                }`}>
                                Total Acumulado: {totalHoras}h {totalRequired > 0 && `/ ${totalRequired}h`}
                            </span>
                        </CardTitle>
                        <CardDescription>Histórico de atividades lançadas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {initialEntries.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    Nenhuma atividade registrada.
                                </div>
                            )}
                            {initialEntries.map((entry) => (
                                <div key={entry.id} className="flex gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col items-center justify-center min-w-[60px] border-r pr-4">
                                        <span className="text-sm font-semibold text-muted-foreground uppercase">
                                            {format(fixDate(entry.dataAtividade), "MMM", { locale: ptBR })}
                                        </span>
                                        <span className="text-2xl font-bold">
                                            {format(fixDate(entry.dataAtividade), "dd")}
                                        </span>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex items-center text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {entry.horasRealizadas}h
                                            </div>
                                        </div>
                                        <p className="text-sm text-foreground/90 leading-relaxed">
                                            {entry.descricaoAtividades}
                                        </p>
                                    </div>
                                    <div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} disabled={isPending}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
