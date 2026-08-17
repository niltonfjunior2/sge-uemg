export interface InternAlertData {
    internName: string;
    courseName: string;
    companyName: string;
    nextStepLabel: string;
    nextStepDescription: string;
    isDelayed: boolean;
    observations: string[];
}

export function buildInternAlertHtml(data: InternAlertData): string {
    const delayWarning = data.isDelayed
        ? `<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin-bottom: 20px;">
             <strong style="color: #b91c1c;">ATENÇÃO:</strong> Existem pendências atrasadas no seu estágio. Acesse o sistema o quanto antes.
           </div>`
        : '';

    const obsSection = data.observations.length > 0
        ? `<div style="margin-top: 20px;">
             <h3 style="color: #374151;">Mensagens de Orientação:</h3>
             <ul style="color: #4b5563;">
               ${data.observations.map(obs => `<li style="margin-bottom: 8px;">${obs}</li>`).join('')}
             </ul>
           </div>`
        : '';

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #111827;">Olá, ${data.internName}</h2>
        <p>Este é um alerta automático de acompanhamento do seu estágio de <strong>${data.courseName}</strong> realizado na empresa <strong>${data.companyName}</strong>.</p>
        
        ${delayWarning}

        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">Próxima Ação Requerida</h3>
            <p><strong>${data.nextStepLabel}:</strong> ${data.nextStepDescription}</p>
        </div>

        ${obsSection}

        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Acesse o <a href="https://sge-sistemas.vercel.app" style="color: #2563eb;">SGE Sistemas de Informação</a> para ver mais detalhes e submeter seus documentos.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">
            Este é um e-mail automático enviado pelo Sistema de Gestão de Estágios da UEMG. Por favor, não responda a este e-mail.
        </p>
    </div>
    `;
}

export interface NewInternshipRequestData {
    professorName: string;
    internName: string;
    courseName: string;
    companyName: string;
}

export function buildNewInternshipRequestHtml(data: NewInternshipRequestData): string {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #111827;">Olá, Prof. ${data.professorName}</h2>
        <p>Um novo aluno acabou de registrar uma solicitação de estágio vinculado à sua oferta de <strong>${data.courseName}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">Detalhes da Solicitação</h3>
            <p><strong>Aluno:</strong> ${data.internName}</p>
            <p><strong>Empresa Concedente:</strong> ${data.companyName}</p>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Acesse o <a href="https://sge-sistemas.vercel.app/admin" style="color: #2563eb;">Painel de Administração do SGE</a> para avaliar o plano de atividades e a documentação enviada.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">
            Este é um e-mail automático enviado pelo Sistema de Gestão de Estágios da UEMG. Por favor, não responda a este e-mail.
        </p>
    </div>
    `;
}
