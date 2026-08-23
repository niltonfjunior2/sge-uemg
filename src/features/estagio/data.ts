import { prisma } from "@/lib/prisma"
import { getCurrentUserRole, createClient } from "@/lib/auth"

export async function getOfertasAtivas(periodo?: number) {
    const whereClause: any = { ativo: true }

    if (periodo) {
        whereClause.curso = {
            periodoVinculado: periodo
        }
    }

    const ofertas = await prisma.ofertaEstagio.findMany({
        where: whereClause,
        include: {
            curso: true,
            professor: {
                include: {
                    profile: true
                }
            }
        }
    })

    return ofertas
}

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

export async function getAllContratos() {
    const contratos = await prisma.contratoEstagio.findMany({
        include: {
            aluno: {
                include: {
                    profile: true
                }
            },
            campo: true,
            oferta: {
                include: {
                    curso: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return contratos
}

export async function getContratoById(id: number) {
    return await prisma.contratoEstagio.findUnique({
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
    })
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
    const role = await getCurrentUserRole()
    if (!role) return { contratos: [], ofertas: [] }

    let whereClause: any = {}
    
    let cursoWhere: any = {};
    if (cursoId) {
        cursoWhere.id = cursoId;
    } else if (unidadeId) {
        cursoWhere.unidadeId = unidadeId;
    }
    const hasCursoFilter = Object.keys(cursoWhere).length > 0;
    
    if (hasCursoFilter) {
        whereClause.oferta = {
            curso: {
                curso: cursoWhere
            }
        };
    }

    if (role === 'PROFESSOR') {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const professor = await prisma.professor.findUnique({
                where: { profileId: user.id }
            })
            if (professor) {
                whereClause.oferta = {
                    ...whereClause.oferta,
                    professorOrientadorId: professor.id
                }
            } else {
                return { contratos: [], ofertas: [] } // Professor profile not found
            }
        }
    } else if (role !== 'ADMIN') {
        return { contratos: [], ofertas: [] } // Aluno shouldn't call this
    }

    const contratos = await prisma.contratoEstagio.findMany({
        where: whereClause,
        include: {
            aluno: {
                include: {
                    profile: true
                }
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
                    }
                }
            },
            acompanhamentos: {
                orderBy: { idEtapaDef: 'asc' },
                include: {
                    etapaDef: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    let ofertas: any[] = []
    if (role === 'PROFESSOR' && whereClause.oferta) {
        ofertas = await prisma.ofertaEstagio.findMany({
            where: {
                professorOrientadorId: whereClause.oferta.professorOrientadorId,
                ativo: true
            },
            include: {
                curso: {
                    include: {
                        curso: {
                            include: {
                                unidade: true
                            }
                        }
                    }
                }
            }
        })
    }

    return { contratos, ofertas }
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

async function buildContextualWhereClause(filtroUnidadeId?: number, filtroCursoId?: number) {
    const role = await getCurrentUserRole();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let whereClause: any = {};

    if (user) {
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
                            curso: {
                                unidadeId: aluno.curso?.unidadeId
                            }
                        }
                    }
                };
            }
        } else if (role === 'PROFESSOR') {
            const prof = await prisma.professor.findUnique({
                where: { profileId: user.id },
                include: { curso: true }
            });
            if (prof?.cursoId) {
                whereClause = {
                    oferta: {
                        curso: {
                            cursoId: prof.cursoId,
                            curso: {
                                unidadeId: prof.curso?.unidadeId
                            }
                        }
                    }
                };
            }
        }
    }

    if (role === 'ADMIN') {
        if (filtroCursoId || filtroUnidadeId) {
            whereClause = { oferta: { curso: {} } };
            if (filtroCursoId) whereClause.oferta.curso.cursoId = filtroCursoId;
            if (filtroUnidadeId) {
                whereClause.oferta.curso.curso = { unidadeId: filtroUnidadeId };
            }
        }
    }
    
    return whereClause;
}

export async function getEmpresasRanking(filtroUnidadeId?: number, filtroCursoId?: number) {
    const whereClause = await buildContextualWhereClause(filtroUnidadeId, filtroCursoId);
    
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
    const whereClause = await buildContextualWhereClause();

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
