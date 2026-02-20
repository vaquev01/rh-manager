"use client";

import Link from "next/link";

export default function TermsPage() {
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
                    <span className="text-sm text-slate-500">Termos de Uso</span>
                </div>
            </nav>

            <article className="max-w-3xl mx-auto px-6 py-12 prose prose-slate prose-sm">
                <h1>Termos de Uso</h1>
                <p className="lead">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

                <h2>1. Aceitação dos Termos</h2>
                <p>Ao acessar e utilizar a plataforma B People (&ldquo;Serviço&rdquo;), você concorda com estes Termos de Uso. Se não concordar, não utilize o Serviço.</p>

                <h2>2. Descrição do Serviço</h2>
                <p>B People é uma plataforma SaaS de gestão de People Ops que oferece funcionalidades de escalas, pagamentos, comunicados, recrutamento e desenvolvimento de equipes, operando em modelo multi-empresa (multi-tenant).</p>

                <h2>3. Contas e Acesso</h2>
                <ul>
                    <li>Cada organização (tenant) possui seus próprios dados isolados.</li>
                    <li>O administrador é responsável pela gestão de acessos e permissões.</li>
                    <li>Você é responsável por manter a confidencialidade de suas credenciais.</li>
                    <li>Níveis de acesso (Admin, Gerente, RH) determinam as ações disponíveis.</li>
                </ul>

                <h2>4. Uso Aceitável</h2>
                <p>Você concorda em não: (a) violar leis aplicáveis; (b) transmitir conteúdo ilegal; (c) tentar acessar dados de outros tenants; (d) realizar engenharia reversa do software.</p>

                <h2>5. Dados e Privacidade</h2>
                <p>O tratamento de dados pessoais é regido pela nossa <Link href="/privacy" className="text-[hsl(173,80%,40%)]">Política de Privacidade</Link> e está em conformidade com a LGPD (Lei 13.709/2018).</p>

                <h2>6. Propriedade Intelectual</h2>
                <p>Todo o software, design, marcas e conteúdo do B People são propriedade exclusiva da empresa. Seus dados permanecem de sua propriedade.</p>

                <h2>7. SLA e Disponibilidade</h2>
                <p>Nos comprometemos com 99.5% de uptime no plano Professional e 99.9% no Enterprise. Manutenções programadas serão comunicadas com 48h de antecedência.</p>

                <h2>8. Pagamentos e Cancelamento</h2>
                <ul>
                    <li>Planos são cobrados mensalmente via cartão de crédito ou PIX.</li>
                    <li>Cancelamento pode ser feito a qualquer momento sem multa.</li>
                    <li>Após cancelamento, dados são mantidos por 30 dias antes da exclusão.</li>
                </ul>

                <h2>9. Limitação de Responsabilidade</h2>
                <p>O B People não se responsabiliza por decisões tomadas com base nos dados da plataforma. Cálculos de pagamento devem ser validados pelo departamento financeiro do cliente.</p>

                <h2>10. Contato</h2>
                <p>Para questões sobre estes termos: <strong>legal@bpeople.com.br</strong></p>
            </article>
        </div>
    );
}
