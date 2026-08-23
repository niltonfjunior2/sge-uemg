"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUserRole } from "@/lib/auth"
import crypto from 'crypto'

export async function verificarDocumentoAction(codigoCompleto: string) {
    try {
        const role = await getCurrentUserRole();
        if (role !== 'ADMIN' && role !== 'PROFESSOR') {
            return { error: "Sem permissão para verificar documentos." };
        }

        if (!codigoCompleto || !codigoCompleto.includes('-')) {
            return { error: "Formato de código inválido. O formato esperado é ID-HASH ou TURMA-ID-HASH." };
        }

        const isTurma = codigoCompleto.startsWith('TURMA-');
        
        if (isTurma) {
            const parts = codigoCompleto.split('-');
            if (parts.length !== 3) return { error: "Formato de código de turma inválido." };
            
            const ofertaId = Number(parts[1]);
            const hashInformado = parts[2];

            if (isNaN(ofertaId)) return { error: "ID da turma inválido no código." };

            const relatorio = await prisma.relatorioEncerramento.findUnique({
                where: { idOferta: ofertaId },
                include: { oferta: { include: { professor: { include: { profile: true } }, curso: true } } }
            });

            if (!relatorio) return { error: "Relatório de turma não encontrado no sistema." };

            const secret = process.env.SUPABASE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'sge-uemg-secret';
            const dataStr = new Date(relatorio.dataEncerramento).toISOString();
            const raw = `TURMA-${relatorio.idOferta}-${relatorio.oferta.professor.profileId}-${dataStr}-${secret}`;
            const hashVerdadeiro = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16).toUpperCase();

            if (hashInformado.toUpperCase() !== hashVerdadeiro) {
                return { error: "CÓDIGO INVÁLIDO! Este documento foi forjado ou alterado." };
            }

            await prisma.logVerificacaoDocumento.create({
                data: {
                    codigoVerificado: codigoCompleto,
                    tipoDocumento: "Relatório Consolidado de Turma",
                }
            });

            return {
                success: true,
                data: {
                    tipo: "Relatório Consolidado de Turma",
                    professorNome: relatorio.oferta.professor.profile.nomeCompleto,
                    curso: relatorio.oferta.curso.nome,
                    dataConclusao: relatorio.dataEncerramento,
                    validadoEm: new Date()
                }
            };
        }

        // Fluxo original para Alunos
        const [idStr, hashInformado] = codigoCompleto.split('-');
        const contratoId = Number(idStr);

        if (isNaN(contratoId)) {
            return { error: "ID do contrato inválido no código." };
        }

        // Buscar dados do contrato
        const contrato = await prisma.contratoEstagio.findUnique({
            where: { id: contratoId },
            include: {
                aluno: { include: { profile: true } },
                oferta: { include: { curso: true } }
            }
        });

        if (!contrato) {
            return { error: "Contrato não encontrado no sistema." };
        }

        // Recriar o hash para validação
        const secret = process.env.SUPABASE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'sge-uemg-secret';
        const dataStr = contrato.dataConclusaoEstagio ? new Date(contrato.dataConclusaoEstagio).toISOString() : 'pendente';
        const raw = `${contrato.id}-${contrato.aluno.profileId}-${dataStr}-${secret}`;
        const hashVerdadeiro = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16).toUpperCase();

        if (hashInformado.toUpperCase() !== hashVerdadeiro) {
            return { error: "CÓDIGO INVÁLIDO! Este documento foi forjado ou alterado." };
        }

        await prisma.logVerificacaoDocumento.create({
            data: {
                codigoVerificado: codigoCompleto,
                tipoDocumento: "Relatório Individual de Aluno",
            }
        });

        return { 
            success: true, 
            data: {
                tipo: "Relatório Individual de Aluno",
                alunoNome: contrato.aluno.profile.nomeCompleto,
                matricula: contrato.aluno.matricula,
                curso: contrato.oferta.curso.nome,
                statusFinal: contrato.statusAprovacao,
                dataConclusao: contrato.dataConclusaoEstagio,
                validadoEm: new Date()
            }
        };

    } catch (e: any) {
        console.error("Erro ao verificar documento", e);
        return { error: "Erro interno no servidor." };
    }
}
