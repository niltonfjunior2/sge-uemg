import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Briefcase, CheckCircle2, AlertCircle, FileCheck2, Library, CheckCircle } from "lucide-react"
import { getAdminDashboardData, getAdminDashboardStats, getFiltrosData } from "@/features/estagio/data"
import { ContratoTable } from "./dashboard/table"
import { ProfessorDashboardClient } from "./professor-dashboard-client"
import { getCurrentUserRole } from "@/lib/auth"
import { DashboardFilters } from "./dashboard-filters"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { unidade?: string; curso?: string };
}) {
    const role = await getCurrentUserRole()
    
    const unidadeId = searchParams.unidade && searchParams.unidade !== 'all' ? Number(searchParams.unidade) : undefined;
    const cursoId = searchParams.curso && searchParams.curso !== 'all' ? Number(searchParams.curso) : undefined;

    // Fetch data based on filters
    const { contratos, ofertas } = await getAdminDashboardData(unidadeId, cursoId)
    const stats = role === 'ADMIN' ? await getAdminDashboardStats(unidadeId, cursoId) : null;
    const { unidades, cursos } = role === 'ADMIN' ? await getFiltrosData() : { unidades: [], cursos: [] };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>

            {/* Professor View: Delegated to Client Component */}
            {role === 'PROFESSOR' && (
                <ProfessorDashboardClient contratos={contratos} ofertas={ofertas} />
            )}

            {/* Admin Only: Stats Cards & Filter */}
            {role === 'ADMIN' && stats && (
                <>
                    <DashboardFilters unidades={unidades} cursos={cursos} />
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Estágios Ofertados</CardTitle>
                                <Library className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.estagiosOfertados}</div>
                                <p className="text-xs text-muted-foreground">Turmas abertas</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Estagiários (Contratos)</CardTitle>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.estagiariosCount}</div>
                                <p className="text-xs text-muted-foreground">Total de vínculos</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Estágios Concluídos</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.estagiosConcluidos}</div>
                                <p className="text-xs text-muted-foreground">Com sucesso</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Estágios Incompletos</CardTitle>
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.estagiosIncompletos}</div>
                                <p className="text-xs text-muted-foreground">Turma encerrada s/ aluno concluir</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Alunos Cadastrados</CardTitle>
                                <Users className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.alunosCadastrados}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Professores</CardTitle>
                                <GraduationCap className="h-4 w-4 text-indigo-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.professoresCadastrados}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Validações Realizadas</CardTitle>
                                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.validacoesRealizadas}</div>
                                <p className="text-xs text-muted-foreground">Verificações de ID-HASH</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="col-span-2 md:col-span-1 lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Relação Professores vs Orientações</CardTitle>
                                <CardDescription>Número total de turmas/ofertas atribuídas a cada professor.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-64 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Professor</TableHead>
                                                <TableHead className="text-right">Qtd. Orientações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats.professoresRelacao.map(prof => (
                                                <TableRow key={prof.id}>
                                                    <TableCell className="font-medium">{prof.profile.nomeCompleto}</TableCell>
                                                    <TableCell className="text-right">{prof._count.ofertas}</TableCell>
                                                </TableRow>
                                            ))}
                                            {stats.professoresRelacao.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                        Nenhum professor encontrado.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Visão Geral dos Estágios</CardTitle>
                            <CardDescription>Gerencie as solicitações e acompanhe o progresso.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ContratoTable contratos={contratos} />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
