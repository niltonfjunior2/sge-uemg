"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { StatusEtapa } from "@prisma/client"
import { NovoEstagioFormData, novoEstagioSchema } from "./schemas"
import { getCurrentUserRole, createClient } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isJanelaCadastroAberta } from "@/lib/system"
import { assertAlunoOwnsContract } from "@/lib/security"
import { sendEmail } from "@/lib/email"
import { buildNewInternshipRequestHtml } from "./email-templates"

// Helper assertAlunoOwnsContract extraído para @/lib/security

export async function createEstagio(data: NovoEstagioFormData) {
    // 1. Authentication & Validation
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado." }
    }

    const validation = novoEstagioSchema.safeParse(data)
    if (!validation.success) {
        return { error: "Dados inválidos. Verifique o formulário." }
    }

    const { empresa, supervisor, estagio } = validation.data

    try {
        // 2. Fetch Student Profile
        const aluno = await prisma.aluno.findUnique({
            where: { profileId: user.id },
            include: { profile: true }
        })

        if (!aluno) {
            return { error: "Perfil de aluno não encontrado." }
        }

        // 3. Find Active Offer for Student's Period AND Selected Course
        const oferta = await prisma.ofertaEstagio.findFirst({
            where: {
                ativo: true,
                cursoEstagioId: estagio.idCurso, // Filter by selected course
                curso: {
                    periodoVinculado: aluno.periodoAtual
                }
            },
            include: { 
                curso: true,
                professor: {
                    include: { profile: true }
                }
            }
        })

        if (!oferta) {
            return { error: `Nenhuma oferta de estágio ativa encontrada para o curso selecionado.` }
        }

        // 4. Create Internship (Transaction to ensure consistency)
        await prisma.$transaction(async (tx) => {
            // A. Create CampoEstagio (Company + Supervisor)
            const campo = await tx.campoEstagio.create({
                data: {
                    razaoSocial: empresa.razaoSocial,
                    nomeFantasia: empresa.nomeFantasia,
                    telefoneContato: empresa.telefone,
                    emailContato: empresa.email,
                    supervisorNome: supervisor.nome,
                    supervisorTelefone: supervisor.telefone,
                    supervisorEmail: supervisor.email,
                    supervisorCargo: supervisor.cargo,
                    supervisorAreaFormacao: supervisor.formacao,
                    supervisorTitulacao: supervisor.titulacao,
                }
            })

            // B. Create ContratoEstagio
            const contrato = await tx.contratoEstagio.create({
                data: {
                    idAluno: aluno.id,
                    idOferta: oferta.id,
                    idCampo: campo.id,
                    modalidade: estagio.modalidade as any, // Cast to avoid stale type error
                    tipoDocumentacao: estagio.tipoDocumentacao as any, // Cast to avoid stale type error
                    dataInicioPrevista: estagio.dataInicio,
                    cargaHorariaDiaria: estagio.cargaHorariaDiaria,
                    atribuicoes: estagio.atribuicoes,
                }
            })
        })

        // Enviar e-mail para o orientador informando a nova solicitação
        try {
            const professorProfile = oferta.professor.profile;
            const alunoProfile = aluno.profile;
            
            // Tenta usar o e-mail alternativo primeiro
            const toEmail = professorProfile.emailAlternativo || professorProfile.email;
            
            const emailHtml = buildNewInternshipRequestHtml({
                professorName: professorProfile.nomeCompleto,
                internName: alunoProfile.nomeCompleto,
                courseName: oferta.curso.nome,
                companyName: empresa.razaoSocial
            });

            await sendEmail({
                to: toEmail,
                subject: `Nova Solicitação de Estágio - ${alunoProfile.nomeCompleto}`,
                html: emailHtml
            });
        } catch (emailError) {
            console.error("Erro ao enviar e-mail de notificação de novo estágio:", emailError);
            // Falha silenciosa para não impedir a criação do estágio caso haja erro de envio de e-mail
        }

        revalidatePath('/aluno')
        return { success: true }

    } catch (error) {
        console.error("Error creating estagio:", error)
        return { error: "Ocorreu um erro ao salvar o estágio. Tente novamente." }
    }
}

export async function approveStage(contratoId: number, etapaId: number, feedback?: string) {
    const role = await getCurrentUserRole()
    if (role !== 'PROFESSOR' && role !== 'ADMIN') {
        return { error: "Sem permissão." }
    }

    // 1. Update Current Stage to Approved
    await prisma.acompanhamentoEtapa.updateMany({
        where: { idContrato: contratoId, idEtapaDef: etapaId },
        data: {
            status: 'ATIVO',
            dataConclusao: new Date(),
            observacoes: feedback
        }
    })

    // 2. Unlock Next Stage (if any)
    const nextStageDef = await prisma.etapaDefinicao.findFirst({
        where: { numeroEtapa: etapaId + 1 }
    })

    if (nextStageDef) {
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + (nextStageDef.prazoDias || 7))

        await prisma.acompanhamentoEtapa.updateMany({
            where: { idContrato: contratoId, idEtapaDef: nextStageDef.id },
            data: {
                status: 'PENDENTE', // Unlock
                dataLimite: deadline
            }
        })
    } else {
        // No next stage -> Contract Fully Approved?
        // Maybe update main contract status
        await prisma.contratoEstagio.update({
            where: { id: contratoId },
            data: { statusAprovacao: 'ATIVO' }
        })
    }

    revalidatePath(`/admin/estagios/${contratoId}`)
    return { success: true }
}

export async function rejectStage(contratoId: number, etapaId: number, feedback: string) {
    const role = await getCurrentUserRole()
    if (role !== 'PROFESSOR' && role !== 'ADMIN') {
        return { error: "Sem permissão." }
    }

    await prisma.acompanhamentoEtapa.updateMany({
        where: { idContrato: contratoId, idEtapaDef: etapaId },
        data: {
            status: 'REJEITADO',
            observacoes: feedback
        }
    })

    // NOTE: We do NOT update the main contract status to PENDENTE anymore.
    // The contract remains ATIVO (Active) so the flow is not interrupted/hidden.
    // The student is blocked by the sequential check on the specific rejected stage.
    /*
    await prisma.contratoEstagio.update({
        where: { id: contratoId },
        data: { statusAprovacao: 'PENDENTE' }
    })
    */

    revalidatePath(`/admin/estagios/${contratoId}`)
    return { success: true }
}

export async function submitEtapaLink(contratoId: number, etapaId: number, link: string) {
    const role = await getCurrentUserRole()
    if (role !== 'ALUNO') {
        return { error: "Sem permissão." }
    }

    // SEG-01: Verificar que o contrato pertence ao aluno autenticado
    const ownerCheck = await assertAlunoOwnsContract(contratoId)
    if (ownerCheck) return ownerCheck

    if (!link || !link.startsWith('http')) {
        return { error: "Link inválido. Certifique-se de incluir http:// ou https://" }
    }

    // Update Stage: Link + Status EM_ANALISE
    await prisma.acompanhamentoEtapa.updateMany({
        where: { idContrato: contratoId, idEtapaDef: etapaId },
        data: {
            linkDocumento: link,
            status: 'EM_ANALISE',
            observacoes: null
        }
    })

    revalidatePath('/aluno')
    return { success: true }
}

export async function logAtividade(contratoId: number, data: Date, horas: number, descricao: string) {
    const role = await getCurrentUserRole()
    if (role !== 'ALUNO') return { error: "Sem permissão." }

    // Fetch Contract to get Limits
    const contrato = await prisma.contratoEstagio.findUnique({
        where: { id: contratoId },
        include: {
            acompanhamentos: {
                orderBy: { idEtapaDef: 'asc' },
                include: { etapaDef: true }
            },
            oferta: { include: { curso: true } }
        }
    })

    if (!contrato) return { error: "Contrato não encontrado." }

    // SEG-01: Verificar que o contrato pertence ao aluno autenticado
    const ownerCheckLog = await assertAlunoOwnsContract(contratoId)
    if (ownerCheckLog) return ownerCheckLog

    // 1. Validate Hours
    if (horas < 1) {
        return { error: "Carga horária mínima é de 1 hora." }
    }
    if (horas > contrato.cargaHorariaDiaria) {
        return { error: `Carga horária diária não pode exceder ${contrato.cargaHorariaDiaria} horas (conforme contrato).` }
    }

    // 2. Validate Weekend
    const day = data.getDay()
    if (day === 0 || day === 6) {
        return { error: "Não é permitido registrar atividades em sábados ou domingos." }
    }

    // 3. Validate Holiday/Recess
    const feriado = await prisma.feriadoRecesso.findFirst({
        where: { data: data }
    })
    if (feriado) {
        return { error: `Data inválida: ${feriado.descricao} (${feriado.tipo})` }
    }

    // 4. Validate Start Date
    // Current Rule: Cannot be before Contract 'dataInicioPrevista'.
    // Logic changed from 'Stage Release Date' to 'Contract Start Date' based on user feedback.
    const minDate = new Date(contrato.dataInicioPrevista)
    minDate.setHours(0, 0, 0, 0)

    const checkDate = new Date(data)
    checkDate.setHours(0, 0, 0, 0)

    if (checkDate < minDate) {
        return { error: `Data inválida. A atividade não pode ser anterior ao início do contrato (${minDate.toLocaleDateString('pt-BR')}).` }
    }

    // 5. Validate Max Date (Offer End Date)
    if (contrato.oferta.dataFim) {
        const maxDate = new Date(contrato.oferta.dataFim)
        maxDate.setHours(0, 0, 0, 0)
        if (checkDate > maxDate) {
            return { error: `Data inválida. A atividade não pode ser posterior ao fim da oferta de estágio (${maxDate.toLocaleDateString('pt-BR')}).` }
        }
    }

    // 6. Validate Total Hours
    const cargaHorariaTotal = contrato.oferta.curso.cargaHorariaTotal

    const allActivities = await prisma.diarioAtividade.findMany({
        where: { idContrato: contratoId }
    })
    const currentTotal = allActivities.reduce((acc, curr) => acc + curr.horasRealizadas, 0)

    if (currentTotal >= cargaHorariaTotal) {
        return { error: `Carga horária total do estágio já foi atingida (${cargaHorariaTotal}h). Não é permitido incluir novas atividades.` }
    }

    let finalHoras = horas
    if (currentTotal + horas > cargaHorariaTotal) {
        finalHoras = cargaHorariaTotal - currentTotal
        // Only proceed if finalHoras >= 1 (min load check might fail if remaining < 1, but usually min daily is 1. If remaining is 0, we caught it above).
        if (finalHoras < 1) {
            return { error: "Carga horária restante é menor que 1h." }
        }
    }

    // 7. Check for duplicates
    const existing = await prisma.diarioAtividade.findFirst({
        where: { idContrato: contratoId, dataAtividade: data }
    })

    if (existing) {
        return { error: "Já existe atividade lançada para esta data." }
    }

    await prisma.diarioAtividade.create({
        data: {
            idContrato: contratoId,
            dataAtividade: data,
            horasRealizadas: finalHoras,
            descricaoAtividades: descricao
        }
    })

    revalidatePath('/aluno')
    return { success: true }
}

export async function deleteAtividade(id: number) {
    const role = await getCurrentUserRole()
    if (role !== 'ALUNO') return { error: "Sem permissão." }

    // SEG-12 + SEG-01: Verificar que a atividade pertence a um contrato do aluno autenticado
    const atividade = await prisma.diarioAtividade.findUnique({
        where: { id },
        select: { idContrato: true }
    })
    if (!atividade) return { error: "Atividade não encontrada." }

    const ownerCheck = await assertAlunoOwnsContract(atividade.idContrato)
    if (ownerCheck) return ownerCheck

    await prisma.diarioAtividade.delete({ where: { id } })
    revalidatePath('/aluno')
    return { success: true }
}


export async function submitRelatorioAtividades(contratoId: number, etapaId: number) {
    const role = await getCurrentUserRole()
    if (role !== 'ALUNO') return { error: "Sem permissão." }

    // SEG-01: Verificar que o contrato pertence ao aluno autenticado
    const ownerCheck = await assertAlunoOwnsContract(contratoId)
    if (ownerCheck) return ownerCheck

    // 1. Check if there are activities
    const atividades = await prisma.diarioAtividade.count({
        where: { idContrato: contratoId }
    })

    if (atividades === 0) {
        return { error: "É necessário registrar pelo menos uma atividade antes de enviar." }
    }

    // 2. Update Stage to EM_ANALISE
    // We don't have a 'link' here, the 'link' is the system itself (the diary entries).
    // We could generate a PDF link later, but for now we mark it for review.
    await prisma.acompanhamentoEtapa.updateMany({
        where: { idContrato: contratoId, idEtapaDef: etapaId },
        data: {
            status: 'EM_ANALISE',
            observacoes: null,
            // link_documento: "DIARIO_DIGITAL" // Optional flag
        }
    })

    revalidatePath('/aluno')
    return { success: true }
}

// Save draft without submitting
export async function saveRelatorioAvaliacao(contratoId: number, texto: string) {
    const role = await getCurrentUserRole()
    if (role !== 'ALUNO') return { error: "Sem permissão." }

    // SEG-01: Verificar que o contrato pertence ao aluno autenticado
    const ownerCheck = await assertAlunoOwnsContract(contratoId)
    if (ownerCheck) return ownerCheck

    await prisma.contratoEstagio.update({
        where: { id: contratoId },
        data: { textoRelatorioAvaliacao: texto }
    })

    revalidatePath(`/aluno/relatorio-final/${contratoId}`)
    return { success: true }
}

export async function submitRelatorio(contratoId: number, etapaId: number, texto: string) {
    const role = await getCurrentUserRole()
    if (role !== 'ALUNO') return { error: "Sem permissão." }

    // SEG-01: Verificar que o contrato pertence ao aluno autenticado
    const ownerCheck = await assertAlunoOwnsContract(contratoId)
    if (ownerCheck) return ownerCheck

    if (!texto || texto.length < 50) {
        return { error: "O relatório deve ter pelo menos 50 caracteres." }
    }

    // Update Contract and Stage
    await prisma.$transaction([
        prisma.contratoEstagio.update({
            where: { id: contratoId },
            data: { textoRelatorioAvaliacao: texto }
        }),
        prisma.acompanhamentoEtapa.updateMany({
            where: { idContrato: contratoId, idEtapaDef: etapaId },
            data: {
                status: 'EM_ANALISE',
                observacoes: null
            }
        })
    ])

    revalidatePath('/aluno')
    return { success: true }
}

export async function deleteContractAction(id: number) {
    const role = await getCurrentUserRole()
    if (role !== 'PROFESSOR' && role !== 'ADMIN') {
        return { success: false, error: "Sem permissão para excluir contratos." }
    }

    try {
        await prisma.contratoEstagio.delete({
            where: { id }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir contrato:", error)
        return { success: false, error: "Erro ao excluir o contrato. Verifique se existem dependências." }
    }
}

export async function updateContractStatusAction(id: number, status: 'ATIVO' | 'PENDENTE') {
    const role = await getCurrentUserRole()
    if (role !== 'PROFESSOR' && role !== 'ADMIN') {
        return { success: false, error: "Sem permissão (updateContractStatus)." }
    }

    try {
        // User request: Change from Pendente to Ativo.
        // Logic: active -> ATIVO.
        const dbStatus = status === 'ATIVO' ? 'ATIVO' : 'PENDENTE'

        await prisma.$transaction(async (tx) => {
            // 1. Update Contract Status
            await tx.contratoEstagio.update({
                where: { id },
                data: { statusAprovacao: dbStatus }
            })

            // 2. If Approved (Active), ensure steps exist
            if (dbStatus === 'ATIVO') {
                const count = await tx.acompanhamentoEtapa.count({
                    where: { idContrato: id }
                })

                if (count === 0) {
                    const etapasDef = await tx.etapaDefinicao.findMany({
                        orderBy: { numeroEtapa: 'asc' }
                    })

                    // Create records for all steps. Default PENDENTE.
                    // Set deadline only for the first step.
                    const now = new Date()

                    for (const def of etapasDef) {
                        let dataLimite = null
                        if (def.numeroEtapa === 1) {
                            const deadline = new Date()
                            deadline.setDate(deadline.getDate() + (def.prazoDias || 7)) // Default 7 if null
                            dataLimite = deadline
                        }

                        await tx.acompanhamentoEtapa.create({
                            data: {
                                idContrato: id,
                                idEtapaDef: def.id,
                                status: 'PENDENTE',
                                dataLimite: dataLimite
                            }
                        })
                    }
                }
            }
        })

        revalidatePath(`/admin/estagios/${id}`)
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar status:", error)
        return { success: false, error: "Erro ao atualizar status." }
    }
}

export async function updateEstagioAction(
    contratoId: number,
    data: {
        supervisor: {
            nome: string;
            cargo: string;
            formacao: string;
            titulacao: string;
            telefone: string;
            email: string;
        };
        atribuicoes: string;
        // New fields
        razaoSocial: string;
        nomeFantasia: string;
        telefoneEmpresa: string;
        emailEmpresa: string;
        modalidade: string;
        cargaHorariaDiaria: number;
        dataInicioPrevista: string;
    }
) {
    const role = await getCurrentUserRole()
    if (role !== "ALUNO" && role !== "ADMIN") {
        return { error: "Sem permissão." }
    }

    // SEG-01: Para ALUNOs, verificar que o contrato pertence ao usuário autenticado
    if (role === 'ALUNO') {
        const ownerCheck = await assertAlunoOwnsContract(contratoId)
        if (ownerCheck) return ownerCheck
    }

    try {
        await prisma.$transaction(async (tx) => {
            const contrato = await tx.contratoEstagio.findUnique({
                where: { id: contratoId },
                include: { campo: true }
            })

            if (!contrato) throw new Error("Contrato não encontrado")

            // Update Campo
            await tx.campoEstagio.update({
                where: { id: contrato.idCampo },
                data: {
                    razaoSocial: data.razaoSocial,
                    nomeFantasia: data.nomeFantasia,
                    telefoneContato: data.telefoneEmpresa,
                    emailContato: data.emailEmpresa,
                    supervisorNome: data.supervisor.nome,
                    supervisorCargo: data.supervisor.cargo,
                    supervisorAreaFormacao: data.supervisor.formacao,
                    supervisorTitulacao: data.supervisor.titulacao,
                    supervisorTelefone: data.supervisor.telefone,
                    supervisorEmail: data.supervisor.email,
                }
            })

            // Update Contrato
            await tx.contratoEstagio.update({
                where: { id: contratoId },
                data: {
                    modalidade: data.modalidade,
                    cargaHorariaDiaria: data.cargaHorariaDiaria,
                    dataInicioPrevista: new Date(data.dataInicioPrevista),
                    atribuicoes: data.atribuicoes
                }
            })
        })

        revalidatePath(`/aluno/docs/capa/${contratoId}/editar`)
        revalidatePath('/aluno')
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar estágio:", error)
        return { error: "Erro ao atualizar dados." }
    }
}

export async function revertStage(contratoId: number) {
    const role = await getCurrentUserRole()
    if (role !== 'PROFESSOR' && role !== 'ADMIN') {
        return { error: "Sem permissão." }
    }

    // 1. Find the latest ATIVO stage (highest number)
    const stagesAtivos = await prisma.acompanhamentoEtapa.findMany({
        where: {
            idContrato: contratoId,
            status: 'ATIVO'
        },
        include: { etapaDef: true },
        orderBy: { etapaDef: { numeroEtapa: 'desc' } }
    })

    let stageToRevert = stagesAtivos[0]

    // 2. If no active stages, check if we can "reset" the very first stage if it's under review
    if (!stageToRevert) {
        const firstStage = await prisma.acompanhamentoEtapa.findFirst({
            where: { idContrato: contratoId },
            include: { etapaDef: true },
            orderBy: { etapaDef: { numeroEtapa: 'asc' } }
        })

        if (firstStage && firstStage.status !== 'ATIVO') {
            stageToRevert = firstStage
        }
    }


    if (!stageToRevert) {
        return { error: "Nenhuma etapa encontrada para retroceder ou resetar." }
    }

    // 3. Update status to PENDENTE
    // This makes it the "Current" pending stage again.
    await prisma.acompanhamentoEtapa.update({
        where: { id: stageToRevert.id },
        data: {
            status: 'PENDENTE',
            dataConclusao: null,
            observacoes: null,
            linkDocumento: null // Clear link so student can re-submit
        }
    })

    revalidatePath(`/admin/estagios/${contratoId}`)
    revalidatePath(`/admin/estagios/contrato/${contratoId}`)
    return { success: true }
}

export async function aprimorarTextoComIA(texto: string, contexto: 'AVALIACAO' | 'ATIVIDADES' = 'AVALIACAO') {
    const role = await getCurrentUserRole()
    if (role !== 'ALUNO') return { error: "Sem permissão." }

    if (!texto || texto.trim().length === 0) {
        return { error: "O texto não pode estar vazio." }
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return { error: "Chave da API do OpenRouter não configurada no servidor." }
    }

    const contextoStr = contexto === 'AVALIACAO' 
        ? "avaliação de conformidade com as atividades desenvolvidas"
        : "apresentação das atividades que serão desenvolvidas";

    const promptText = `Aprimore o texto a seguir, que será utilizado como ${contextoStr} em um estágio acadêmico relacionado a um curso superior de Sistemas de Informação. Regras obrigatórias: 1) O idioma deve ser o Português do Brasil. 2) Retorne APENAS o texto aprimorado, nada além disso. 3) NÃO inclua saudações, introduções, conclusões ou explicações (como "Aqui está o texto..." ou "Com certeza!"). 4) NÃO utilize formatação Markdown (como asteriscos para negrito ou hashtags), retorne apenas texto puro. Texto original:\n\n${texto}`;

    try {
        const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "openrouter/auto",
                messages: [
                    {
                        role: "user",
                        content: promptText
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("OpenRouter API Error:", response.status, errorData);
            if (response.status === 429) {
                return { error: "Cota de uso da IA excedida (Erro 429). Tente novamente mais tarde e verifique os limites de uso da chave." }
            }
            return { error: "Erro ao comunicar com a IA." }
        }

        const data = await response.json();
        const aprimorado = data?.choices?.[0]?.message?.content;

        if (!aprimorado) {
            return { error: "Resposta inesperada da IA." }
        }

        return { success: true, text: aprimorado }

    } catch (error) {
        console.error("Fetch Exception:", error);
        return { error: "Falha na conexão com a IA." }
    }
}

// Wrapper for backwards compatibility if still used directly
export async function aprimorarAtividadesComIA(texto: string) {
    return aprimorarTextoComIA(texto, 'ATIVIDADES');
}
