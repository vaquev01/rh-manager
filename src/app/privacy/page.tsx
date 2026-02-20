"use client";

import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-2">
                    <Link href="/landing" className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-[hsl(173,80%,40%)] flex items-center justify-center">
                            <span className="text-white font-black text-[10px]">B</span>
                        </div>
                        <span className="font-bold text-sm text-slate-900">B People</span>
                    </Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-sm text-slate-500">Política de Privacidade</span>
                </div>
            </nav>

            <article className="max-w-3xl mx-auto px-6 py-12 prose prose-slate prose-sm">
                <h1>Política de Privacidade</h1>
                <p className="lead">Em conformidade com a LGPD (Lei 13.709/2018). Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

                <h2>1. Dados Coletados</h2>
                <h3>1.1 Dados Pessoais de Colaboradores</h3>
                <ul>
                    <li>Nome completo, CPF, data de nascimento</li>
                    <li>Email, telefone</li>
                    <li>Dados bancários (chave PIX) para fins de pagamento</li>
                    <li>Dados contratuais (tipo, cargo, remuneração)</li>
                </ul>
                <h3>1.2 Dados dos Usuários da Plataforma</h3>
                <ul>
                    <li>Email e senha (hash bcrypt)</li>
                    <li>Registros de acesso e ações (audit log)</li>
                    <li>Preferências de uso e configurações</li>
                </ul>

                <h2>2. Finalidade do Tratamento</h2>
                <ul>
                    <li>Gestão de escalas e operação</li>
                    <li>Cálculo e processamento de pagamentos</li>
                    <li>Comunicação corporativa</li>
                    <li>Processos de recrutamento e seleção</li>
                    <li>Desenvolvimento e avaliação de competências</li>
                    <li>Geração de relatórios operacionais</li>
                </ul>

                <h2>3. Base Legal</h2>
                <p>O tratamento dos dados é realizado com base em: (a) execução de contrato; (b) cumprimento de obrigação legal trabalhista; (c) legítimo interesse; (d) consentimento quando aplicável.</p>

                <h2>4. Compartilhamento de Dados</h2>
                <p>Seus dados NÃO são vendidos. Compartilhamos apenas com:</p>
                <ul>
                    <li>Processadores de pagamento (para PIX/transferências)</li>
                    <li>Serviços de infraestrutura (hosting, banco de dados) com DPA assinado</li>
                    <li>Autoridades quando exigido por lei</li>
                </ul>

                <h2>5. Segurança</h2>
                <ul>
                    <li>Criptografia em trânsito (TLS 1.3) e em repouso (AES-256)</li>
                    <li>Isolamento multi-tenant com Row-Level Security</li>
                    <li>Backups automáticos diários com retenção de 30 dias</li>
                    <li>Controle de acesso baseado em função (RBAC)</li>
                </ul>

                <h2>6. Retenção de Dados</h2>
                <ul>
                    <li>Dados ativos: mantidos enquanto o contrato estiver vigente</li>
                    <li>Após cancelamento: 30 dias para exportação, depois exclusão</li>
                    <li>Dados trabalhistas: mantidos por 5 anos conforme legislação</li>
                </ul>

                <h2>7. Direitos do Titular</h2>
                <p>Você tem direito a: acesso, correção, exclusão, portabilidade e revogação do consentimento. Exercite seus direitos em: <strong>privacidade@bpeople.com.br</strong></p>

                <h2>8. DPO</h2>
                <p>Encarregado de Proteção de Dados: <strong>dpo@bpeople.com.br</strong></p>
            </article>
        </div>
    );
}
