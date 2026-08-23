"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, PlusCircle, LogOut, User, History, Menu, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { logoutAction } from "@/features/auth/actions/logout-action"
import { useState } from "react"

interface AlunoSidebarProps {
    userName: string
    hasActiveInternship: boolean
}

export function AlunoSidebar({ userName, hasActiveInternship }: AlunoSidebarProps) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    const NavLinks = () => (
        <>
            <Link href="/aluno" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/aluno" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <Home className="h-4 w-4" />
                    Dashboard
                </Button>
            </Link>
            <Link href="/aluno/novo-estagio" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/aluno/novo-estagio" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Novo Estágio
                </Button>
            </Link>
            <Link href="/aluno/perfil" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/aluno/perfil" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <User className="h-4 w-4" />
                    Minha Conta
                </Button>
            </Link>
            <Link href="/aluno/manual" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/aluno/manual" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Manuais
                </Button>
            </Link>
            <Link href="/aluno/historico" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/aluno/historico" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <History className="h-4 w-4" />
                    Histórico de Estágios
                </Button>
            </Link>
            <Link href="/aluno/ranking" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/aluno/ranking" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <Trophy className="h-4 w-4" />
                    Ranking de Empresas
                </Button>
            </Link>

            <Link href="/aluno/documentos" onClick={() => setOpen(false)}>
                <Button variant={pathname === "/aluno/documentos" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos
                </Button>
            </Link>
            
            <div className="mt-auto border-t pt-4">
                <form action={logoutAction}>
                    <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-50">
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
                <Link href="/aluno" className="flex items-center gap-2 font-semibold">
                    <span className="text-xl font-bold tracking-tight">SGE Aluno</span>
                </Link>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-4">
                        <div className="flex flex-col justify-start items-start mb-4">
                            <span className="text-xl font-bold tracking-tight">SGE Aluno</span>
                            <span className="text-xs text-muted-foreground font-medium mt-1 w-full truncate" title={userName}>
                                {userName}
                            </span>
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
                    <Link href="/aluno" className="flex items-center gap-2 font-semibold">
                        <span className="text-xl font-bold tracking-tight">SGE Aluno</span>
                    </Link>
                    <span className="text-xs text-muted-foreground font-medium truncate w-full" title={userName}>
                        {userName}
                    </span>
                </div>
                <nav className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto">
                    <NavLinks />
                </nav>
            </aside>
        </>
    )
}
