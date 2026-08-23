"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    LogOut,
    Calendar,
    UserRoundCheck,
    Briefcase,
    ListOrdered,
    ShieldCheck,
    History,
    Menu,
    Trophy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { logoutAction } from "@/features/auth/actions/logout-action"
import { useState } from "react"

interface AdminSidebarProps {
    role: string
    userName: string
}

export function AdminSidebar({ role, userName }: AdminSidebarProps) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    const NavLinks = () => (
        <>
            <Link href="/admin" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/admin" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Painel
                </Button>
            </Link>

            <Link href="/admin/perfil" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/admin/perfil" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    Meus Dados
                </Button>
            </Link>

            {role === 'ADMIN' && (
                <>
                    <Link href="/admin/unidades" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/unidades" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Unidades
                        </Button>
                    </Link>

                    <Link href="/admin/cursos" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/cursos" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Cursos
                        </Button>
                    </Link>

                    <Link href="/admin/professores" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/professores" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <UserRoundCheck className="h-4 w-4" />
                            Professores
                        </Button>
                    </Link>

                    <Link href="/admin/alunos" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/alunos" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <Users className="h-4 w-4" />
                            Alunos
                        </Button>
                    </Link>

                    <Link href="/admin/configuracoes" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/configuracoes" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <Settings className="h-4 w-4" />
                            Configurações
                        </Button>
                    </Link>

                    <Link href="/admin/etapas" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/etapas" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <ListOrdered className="h-4 w-4" />
                            Etapas do Estágio
                        </Button>
                    </Link>
                </>
            )}

            <Link href="/admin/calendario" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/admin/calendario" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <Calendar className="h-4 w-4" />
                    Calendário
                </Button>
            </Link>

            <Link href="/admin/historico-orientacoes" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/admin/historico-orientacoes" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <History className="h-4 w-4" />
                    Histórico
                </Button>
            </Link>

            <Link href="/admin/ranking" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/admin/ranking" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <Trophy className="h-4 w-4" />
                    Ranking Empresas
                </Button>
            </Link>

            <Link href="/admin/documentos" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/admin/documentos" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos
                </Button>
            </Link>

            <Link href="/admin/verificar-documento" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/admin/verificar-documento" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Validar Docs
                </Button>
            </Link>

            <Link href="/admin/manual" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/admin/manual" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Manuais
                </Button>
            </Link>

            {role === 'ADMIN' && (
                <>
                    <Link href="/admin/estagios" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/estagios" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <FileText className="h-4 w-4" />
                            Estágios
                        </Button>
                    </Link>

                    <Link href="/admin/ofertas" onClick={() => setOpen(false)}>
                        <Button variant={pathname === "/admin/ofertas" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                            <Briefcase className="h-4 w-4" />
                            Ofertas
                        </Button>
                    </Link>
                </>
            )}

            <div className="mt-auto border-t pt-4">
                <form action={logoutAction}>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-50">
                        <LogOut className="h-4 w-4" />
                        Sair
                    </Button>
                </form>
            </div>
        </>
    )

    return (
        <>
            {/* Topbar for Mobile */}
            <header className="flex h-16 w-full items-center justify-between border-b bg-muted/40 px-4 md:hidden">
                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                    <span className="text-xl font-bold tracking-tight">SGE Admin</span>
                </Link>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-4">
                        <div className="flex flex-col justify-start items-start mb-4">
                            <span className="text-xl font-bold tracking-tight">SGE Admin</span>
                            <span className="text-xs text-muted-foreground font-medium mt-1">{userName}</span>
                        </div>
                        <nav className="flex flex-col gap-2 overflow-y-auto">
                            <NavLinks />
                        </nav>
                    </SheetContent>
                </Sheet>
            </header>

            {/* Sidebar for Desktop */}
            <aside className="hidden w-64 flex-col border-r bg-muted/40 h-full md:flex">
                <div className="flex h-16 items-center border-b px-6 flex-col justify-center items-start">
                    <Link href="/admin" className="flex items-center gap-2 font-semibold">
                        <span className="text-xl font-bold tracking-tight">SGE Admin</span>
                    </Link>
                    <span className="text-xs text-muted-foreground font-medium">{userName}</span>
                </div>
                <nav className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto">
                    <NavLinks />
                </nav>
            </aside>
        </>
    )
}
