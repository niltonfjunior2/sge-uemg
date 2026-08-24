import { prisma } from "@/lib/prisma"
import { getCurrentUserRole, createClient } from "@/lib/auth"

export async function getStudentDashboardData(profileId: string) {
    const aluno = await prisma.aluno.findUnique({
        where: { profileId }
    })

    if (!aluno) return { contratos: [] }

    const contratos = await prisma.contratoEstagio.findMany({
        where: { idAluno: aluno.id },
        include: {
            campo: true,
            oferta: {
                include: {
                    curso: true
                }
            },
            acompanhamentos: {
                orderBy: { idEtapaDef: 'asc' },
                include: {
                    etapaDef: true
                }
            },
            diarios: {
                select: { dataAtividade: true },
                orderBy: { dataAtividade: 'desc' },
                take: 1
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return { contratos }
}

export async function getContratoById(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const role = await getCurrentUserRole();
    if (!role) return null;

    const contrato = await prisma.contratoEstagio.findUnique({
        where: { id },
        include: {
            aluno: {
                include: { profile: true }
            },
            campo: true,
            oferta: {
                include: {
                    curso: {
                        include: {
                            curso: {
                                include: {
                                    unidade: true
                                }
                            }
                        }
                    },
                    professor: {
                        include: { profile: true }
                    }
                }
            },
            acompanhamentos: {
                orderBy: { idEtapaDef: 'asc' },
                include: {
                    etapaDef: true
                }
            }
        }
    });

    if (!contrato) return null;

    if (role === 'ALUNO') {
        const aluno = await prisma.aluno.findUnique({ where: { profileId: user.id } });
        if (!aluno || contrato.idAluno !== aluno.id) return null;
    } else if (role === 'PROFESSOR') {
        const prof = await prisma.professor.findUnique({ where: { profileId: user.id } });
        if (!prof || contrato.oferta.professorOrientadorId !== prof.id) return null;
    } else if (role !== 'ADMIN') {
        return null;
    }

    return contrato;
}

export async function getDiarioAtividades(contratoId: number) {
    return await prisma.diarioAtividade.findMany({
        where: { idContrato: contratoId },
        orderBy: { dataAtividade: 'asc' }
    })
}

export async function getInformacoesGerais() {
    return await prisma.informacoesGeraisEstagio.findMany({
        where: { ativo: true },
        orderBy: { descricao: 'asc' }
    })
}

export async function getAdminDashboardData(unidadeId?: number, cursoId?: number) {
    const { role, isProfessorAndMissingProfile, whereClause } = await getAuthorizedContext(unidadeId, cursoId);
    
    if (role !== 'ADMIN' && role !== 'PROFESSOR') {
        return { contratos: [], ofertas: [] };
    }
    
    if (isProfessorAndMissingProfile) {
        return { contratos: [], ofertas: [] };
    }

    const contratos = await prisma.contratoEstagio.findMany({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        include: {
            aluno: {
                include: { profile: true }
            },
            campo: true,
            oferta: {
                include: {
                    curso: {
                        include: {
                            curso: {
                                include: { unidade: true }
                            }
                        }
                    }
                }
            },
            acompanhamentos: {
                orderBy: { idEtapaDef: 'asc' },
                include: { etapaDef: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    let ofertas: any[] = [];
    if (role === 'PROFESSOR' && whereClause.oferta?.professorOrientadorId) {
        ofertas = await prisma.ofertaEstagio.findMany({
            where: {
                professorOrientadorId: whereClause.oferta.professorOrientadorId,
                ativo: true
            },
            include: {
                curso: {
                    include: {
                        curso: {
                            include: { unidade: true }
                        }
                    }
                }
            }
        });
    }

    return { contratos, ofertas };
}

export async function getFeriados() {
    return await prisma.feriadoRecesso.findMany({
        orderBy: { data: 'asc' }
    })
}

export async function getAdminDashboardStats(unidadeId?: number, cursoId?: number) {
    const role = await getCurrentUserRole();
    if (role !== 'ADMIN') {
        throw new Error("Não autorizado");
    }

    let cursoWhere: any = {};
    if (cursoId) {
        cursoWhere.id = cursoId;
    } else if (unidadeId) {
        cursoWhere.unidadeId = unidadeId;
    }

    const hasCursoFilter = Object.keys(cursoWhere).length > 0;

    const ofertaWhere = hasCursoFilter ? {
        curso: {
            curso: cursoWhere
        }
    } : {};

    const alunoWhere = hasCursoFilter ? {
        curso: cursoWhere
    } : {};

    const professorWhere = hasCursoFilter ? {
        curso: cursoWhere
    } : {};

    const [
        estagiosOfertados,
        estagiariosCount,
        estagiosConcluidos,
        estagiosIncompletos,
        alunosCadastrados,
        professoresCadastrados,
        professoresRelacao,
        validacoesRealizadas
    ] = await Promise.all([
        prisma.ofertaEstagio.count({ where: ofertaWhere }),
        
        prisma.contratoEstagio.count({ where: { oferta: ofertaWhere } }),
        
        prisma.contratoEstagio.count({
            where: {
                statusAprovacao: 'ENCERRADO',
                oferta: ofertaWhere
            }
        }),
        
        prisma.contratoEstagio.count({
            where: {
                statusAprovacao: { not: 'ENCERRADO' },
                oferta: {
                    ...ofertaWhere,
                    relatorio: { isNot: null }
                }
            }
        }),
        
        prisma.aluno.count({ where: alunoWhere }),
        
        prisma.professor.count({ where: professorWhere }),
        
        prisma.professor.findMany({
            where: professorWhere,
            include: {
                profile: true,
                _count: { select: { ofertas: true } }
            },
            orderBy: { ofertas: { _count: 'desc' } }
        }),
        
        prisma.logVerificacaoDocumento.count()
    ]);

    return {
        estagiosOfertados,
        estagiariosCount,
        estagiosConcluidos,
        estagiosIncompletos,
        alunosCadastrados,
        professoresCadastrados,
        professoresRelacao,
        validacoesRealizadas
    };
}

export async function getFiltrosData() {
    const unidades = await prisma.unidadeAcademica.findMany({
        orderBy: { nome: 'asc' }
    });
    
    const cursos = await prisma.curso.findMany({
        orderBy: { nome: 'asc' }
    });

    return { unidades, cursos };
}

export async function getAuthorizedContext(filtroUnidadeId?: number, filtroCursoId?: number) {
    const role = await getCurrentUserRole();
    if (!role) throw new Error("Unauthorized");

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    let whereClause: any = {};
    let isProfessorAndMissingProfile = false;

    if (role === 'ALUNO') {
        const aluno = await prisma.aluno.findUnique({
            where: { profileId: user.id },
            include: { curso: true }
        });
        if (aluno?.cursoId) {
            whereClause = {
                oferta: {
                    curso: {
                        cursoId: aluno.cursoId,
                        curso: { unidadeId: aluno.curso?.unidadeId }
                    }
                }
            };
        }
    } else if (role === 'PROFESSOR') {
        const prof = await prisma.professor.findUnique({
            where: { profileId: user.id },
            include: { curso: true }
        });
        if (prof) {
            whereClause = { oferta: { professorOrientadorId: prof.id } };
            
            let cursoWhere: any = {};
            if (filtroCursoId) {
                cursoWhere.id = filtroCursoId;
            } else if (filtroUnidadeId) {
                cursoWhere.unidadeId = filtroUnidadeId;
            } else if (prof.cursoId) {
                // If professor has a specific curso tied to their profile, we could filter by it, 
                // but usually the admin filters are what matter. We will apply the admin-like filters if requested.
                // Or we can just limit to their own orientações, which we already do via professorOrientadorId.
            }

            if (Object.keys(cursoWhere).length > 0) {
                 whereClause.oferta.curso = { curso: cursoWhere };
            }

        } else {
            isProfessorAndMissingProfile = true;
        }
    } else if (role === 'ADMIN') {
        if (filtroCursoId || filtroUnidadeId) {
            whereClause = { oferta: { curso: {} } };
            if (filtroCursoId) whereClause.oferta.curso.cursoId = filtroCursoId;
            if (filtroUnidadeId) {
                whereClause.oferta.curso.curso = { unidadeId: filtroUnidadeId };
            }
        }
    }
    
    return { user, role, whereClause, isProfessorAndMissingProfile };
}

export async function getEmpresasRanking(filtroUnidadeId?: number, filtroCursoId?: number) {
    const { whereClause } = await getAuthorizedContext(filtroUnidadeId, filtroCursoId);
    
    whereClause.tipoDocumentacao = 'Termo de Compromisso de Estágio';

    const contratos = await prisma.contratoEstagio.findMany({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        include: {
            campo: true,
            oferta: true
        },
        orderBy: {
            oferta: { dataInicio: 'desc' }
        }
    });

    const rankMap = new Map<string, { razaoSocial: string; totalEstagios: number; ultimoPeriodo: string }>();

    for (const contrato of contratos) {
        const razao = contrato.campo.razaoSocial.trim();
        const nomeUpper = razao.toUpperCase();

        if (!rankMap.has(nomeUpper)) {
            rankMap.set(nomeUpper, {
                razaoSocial: razao,
                totalEstagios: 1,
                ultimoPeriodo: contrato.oferta.semestreLetivo
            });
        } else {
            const current = rankMap.get(nomeUpper)!;
            current.totalEstagios += 1;
            rankMap.set(nomeUpper, current);
        }
    }

    return Array.from(rankMap.values()).sort((a, b) => b.totalEstagios - a.totalEstagios);
}

export async function getEmpresasNomes() {
    const { whereClause } = await getAuthorizedContext();
    
    // Removendo o filtro de tipoDocumentacao para que o formulário exiba todas as empresas (Termo ou Dispensa)
    // whereClause.tipoDocumentacao = 'Termo de Compromisso de Estágio';

    const campos = await prisma.campoEstagio.findMany({
        where: Object.keys(whereClause).length > 0 ? {
            contratos: {
                some: whereClause
            }
        } : undefined,
        select: { razaoSocial: true },
        distinct: ['razaoSocial']
    });
    return campos.map(c => c.razaoSocial.trim()).filter(Boolean).sort();
}
