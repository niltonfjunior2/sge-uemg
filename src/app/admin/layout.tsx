import { getCurrentUserRole, createClient } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/layout/admin-sidebar"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const role = await getCurrentUserRole()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userName = "Usuário"
    if (user) {
        const profile = await prisma.profile.findUnique({
            where: { id: user.id }
        })
        if (profile) userName = profile.nomeCompleto.split(' ')[0] // Primeiro nome para economizar espaço
    }

    // Protect Admin Route: Allow only PROFESSOR or ADMIN
    if (!role || (role !== 'PROFESSOR' && role !== 'ADMIN')) {
        redirect('/')
    }

    return (
        <div className="flex h-screen w-full flex-col md:flex-row">
            <AdminSidebar role={role} userName={userName} />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
                {children}
            </main>
        </div>
    )
}
