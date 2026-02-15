import { defaultRecruitmentChecklist } from "@/lib/constants";
import { TODAY } from "@/lib/date";
import {
  AdditionalTypeConfig,
  AppState,
  PaymentDayItem,
  PermissionAction,
  UserRole
} from "@/lib/types";

function permissionsByRole(): Record<UserRole, Record<PermissionAction, boolean>> {
  return {
    ADMIN_GRUPO: {
      EDITAR_REMUNERACAO_REGRA: true,
      FECHAR_PAGAMENTOS_DIA: true,
      REABRIR_PAGAMENTOS_DIA: true,
      EDITAR_PIX: true,
      EDITAR_STATUS: true,
      EDITAR_ETAPAS_RECRUTAMENTO: true,
      DISPARAR_COMUNICADOS_MASSA: true
    },
    ADMIN_EMPRESA: {
      EDITAR_REMUNERACAO_REGRA: true,
      FECHAR_PAGAMENTOS_DIA: true,
      REABRIR_PAGAMENTOS_DIA: true,
      EDITAR_PIX: true,
      EDITAR_STATUS: true,
      EDITAR_ETAPAS_RECRUTAMENTO: true,
      DISPARAR_COMUNICADOS_MASSA: true
    },
    RH_OPERACAO: {
      EDITAR_REMUNERACAO_REGRA: true,
      FECHAR_PAGAMENTOS_DIA: true,
      REABRIR_PAGAMENTOS_DIA: true,
      EDITAR_PIX: true,
      EDITAR_STATUS: true,
      EDITAR_ETAPAS_RECRUTAMENTO: true,
      DISPARAR_COMUNICADOS_MASSA: true
    },
    LIDER: {
      EDITAR_REMUNERACAO_REGRA: false,
      FECHAR_PAGAMENTOS_DIA: false,
      REABRIR_PAGAMENTOS_DIA: false,
      EDITAR_PIX: false,
      EDITAR_STATUS: true,
      EDITAR_ETAPAS_RECRUTAMENTO: true,
      DISPARAR_COMUNICADOS_MASSA: false
    },
    COLABORADOR: {
      EDITAR_REMUNERACAO_REGRA: false,
      FECHAR_PAGAMENTOS_DIA: false,
      REABRIR_PAGAMENTOS_DIA: false,
      EDITAR_PIX: false,
      EDITAR_STATUS: false,
      EDITAR_ETAPAS_RECRUTAMENTO: false,
      DISPARAR_COMUNICADOS_MASSA: false
    }
  };
}

function additionalTypes(): AdditionalTypeConfig[] {
  return [
    {
      id: "addtype-1",
      nome: "TRANSPORTE",
      ativo: true,
      pagavelViaPixPorPadrao: true,
      descricaoObrigatoria: false
    },
    {
      id: "addtype-2",
      nome: "ALIMENTACAO",
      ativo: true,
      pagavelViaPixPorPadrao: true,
      descricaoObrigatoria: false
    },
    {
      id: "addtype-3",
      nome: "BONUS",
      ativo: true,
      pagavelViaPixPorPadrao: true,
      descricaoObrigatoria: false
    },
    {
      id: "addtype-4",
      nome: "DESCONTO",
      ativo: true,
      pagavelViaPixPorPadrao: false,
      descricaoObrigatoria: false
    },
    {
      id: "addtype-5",
      nome: "OUTRO",
      ativo: true,
      pagavelViaPixPorPadrao: false,
      descricaoObrigatoria: true
    }
  ];
}

const yesterday = "2026-02-13";

const previousItems: PaymentDayItem[] = [
  {
    id: "item-prev-1",
    date: yesterday,
    personId: "p1",
    valorBase: 176,
    adicionais: [{ tipo: "TRANSPORTE", valor: 24, pagavelViaPix: true }],
    total: 200,
    paymentRuleSnapshot: { id: "rule-hourly-op", type: "VALOR_HORA", valorHora: 22 },
    horasSnapshot: 8,
    pixSnapshot: { chavePix: "111.222.333-44", valor: 200 },
    statusPago: "PAGO"
  },
  {
    id: "item-prev-2",
    date: yesterday,
    personId: "p4",
    valorBase: 190,
    adicionais: [{ tipo: "BONUS", valor: 30, pagavelViaPix: true }],
    total: 220,
    paymentRuleSnapshot: { id: "rule-daily-kitchen", type: "DIARIA", valorDiaria: 190 },
    horasSnapshot: 8,
    pixSnapshot: { chavePix: "freela.maicon@pix", valor: 220 },
    statusPago: "PAGO"
  }
];

export function createInitialState(): AppState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    grupo: {
      id: "g1",
      nome: "Grupo Horizonte"
    },
    companies: [
      { id: "c1", groupId: "g1", nome: "Aurora Food Service" },
      { id: "c2", groupId: "g1", nome: "Nexa Retail" }
    ],
    units: [
      { id: "u1", companyId: "c1", nome: "Centro" },
      { id: "u2", companyId: "c1", nome: "Zona Sul" },
      { id: "u3", companyId: "c2", nome: "Shopping Norte" },
      { id: "u4", companyId: "c2", nome: "Logistica" }
    ],
    teams: [
      { id: "t1", unitId: "u1", nome: "Operacao Manha", leaderPersonId: "p2" },
      { id: "t2", unitId: "u2", nome: "Operacao Noite", leaderPersonId: "p3" },
      { id: "t3", unitId: "u3", nome: "Loja Piso", leaderPersonId: "p8" },
      { id: "t4", unitId: "u4", nome: "Separacao", leaderPersonId: "p9" }
    ],
    roles: [
      {
        id: "role-attendant",
        nome: "Atendente",
        familia: "Operacao",
        nivel: "Junior",
        defaultType: "FIXO",
        defaultPaymentRuleId: "rule-hourly-op"
      },
      {
        id: "role-cook",
        nome: "Cozinheiro",
        familia: "Operacao",
        nivel: "Pleno",
        defaultType: "FIXO",
        defaultPaymentRuleId: "rule-daily-kitchen"
      },
      {
        id: "role-supervisor",
        nome: "Supervisor",
        familia: "Lideranca",
        nivel: "Senior",
        defaultType: "FIXO",
        defaultPaymentRuleId: "rule-shift-sup"
      },
      {
        id: "role-cashier",
        nome: "Caixa",
        familia: "Varejo",
        nivel: "Junior",
        defaultType: "FIXO",
        defaultPaymentRuleId: "rule-hourly-retail"
      }
    ],
    paymentRules: [
      {
        id: "rule-hourly-op",
        companyId: "c1",
        type: "VALOR_HORA",
        valorHora: 22
      },
      {
        id: "rule-daily-kitchen",
        companyId: "c1",
        type: "DIARIA",
        valorDiaria: 190
      },
      {
        id: "rule-shift-sup",
        type: "TURNO",
        valorTurno: 120,
        qtdTurnosPadrao: 2
      },
      {
        id: "rule-hourly-retail",
        companyId: "c2",
        type: "VALOR_HORA",
        valorHora: 26
      },
      {
        id: "rule-freela-premium",
        type: "VALOR_HORA",
        valorHora: 31
      }
    ],
    people: [
      {
        id: "p1",
        nome: "Ana Martins",
        cargoId: "role-attendant",
        type: "FIXO",
        status: "ATIVO",
        companyId: "c1",
        unitId: "u1",
        teamId: "t1",
        leaderPersonId: "p2",
        contatoTelefone: "5511991010101",
        pixKey: "111.222.333-44",
        paymentRuleId: "rule-hourly-op",
        performance: { dia: "VERDE", semana: 0.88, mes: 0.84 },
        createdAt: "2025-01-10T11:00:00.000Z",
        updatedAt: "2026-02-14T08:00:00.000Z"
      },
      {
        id: "p2",
        nome: "Diego Rocha",
        cargoId: "role-supervisor",
        type: "FIXO",
        status: "ATIVO",
        companyId: "c1",
        unitId: "u1",
        teamId: "t1",
        contatoTelefone: "5511991010102",
        pixKey: "diego.rocha@pix",
        paymentRuleId: "rule-shift-sup",
        performance: { dia: "VERDE", semana: 0.91, mes: 0.9 },
        createdAt: "2024-11-10T11:00:00.000Z",
        updatedAt: "2026-02-14T08:00:00.000Z"
      },
      {
        id: "p3",
        nome: "Bruna Teixeira",
        cargoId: "role-supervisor",
        type: "FIXO",
        status: "ATIVO",
        companyId: "c1",
        unitId: "u2",
        teamId: "t2",
        contatoTelefone: "5511991010103",
        pixKey: "bruna.teixeira@pix",
        paymentRuleId: "rule-shift-sup",
        performance: { dia: "AMARELO", semana: 0.78, mes: 0.82 },
        createdAt: "2024-10-03T11:00:00.000Z",
        updatedAt: "2026-02-14T08:00:00.000Z"
      },
      {
        id: "p4",
        nome: "Maicon Freela",
        cargoId: "role-cook",
        type: "FREELA",
        status: "ATIVO",
        companyId: "c1",
        unitId: "u2",
        teamId: "t2",
        leaderPersonId: "p3",
        contatoTelefone: "5511991010104",
        pixKey: "freela.maicon@pix",
        paymentRuleId: "rule-daily-kitchen",
        performance: { dia: "VERDE", semana: 0.81, mes: 0.8 },
        createdAt: "2025-09-20T11:00:00.000Z",
        updatedAt: "2026-02-14T08:00:00.000Z"
      },
      {
        id: "p5",
        nome: "Lais Souza",
        cargoId: "role-cook",
        type: "FIXO",
        status: "FERIAS",
        companyId: "c1",
        unitId: "u2",
        teamId: "t2",
        leaderPersonId: "p3",
        contatoTelefone: "5511991010105",
        pixKey: "",
        paymentRuleId: "rule-daily-kitchen",
        performance: { dia: "AMARELO", semana: 0.66, mes: 0.75 },
        createdAt: "2024-06-20T11:00:00.000Z",
        updatedAt: "2026-02-12T08:00:00.000Z"
      },
      {
        id: "p6",
        nome: "Felipe Campos",
        cargoId: "role-attendant",
        type: "FREELA",
        status: "ATIVO",
        companyId: "c1",
        unitId: "u1",
        teamId: "t1",
        leaderPersonId: "p2",
        contatoTelefone: "5511991010106",
        paymentRuleId: "rule-freela-premium",
        performance: { dia: "VERMELHO", semana: 0.55, mes: 0.62 },
        createdAt: "2025-10-01T11:00:00.000Z",
        updatedAt: "2026-02-14T08:00:00.000Z"
      },
      {
        id: "p7",
        nome: "Kelly Nunes",
        cargoId: "role-cashier",
        type: "FIXO",
        status: "ATIVO",
        companyId: "c2",
        unitId: "u3",
        teamId: "t3",
        leaderPersonId: "p8",
        contatoTelefone: "5511991010107",
        pixKey: "kelly@pix",
        paymentRuleId: "rule-hourly-retail",
        performance: { dia: "VERDE", semana: 0.86, mes: 0.88 },
        createdAt: "2024-05-11T11:00:00.000Z",
        updatedAt: "2026-02-14T08:00:00.000Z"
      },
      {
        id: "p8",
        nome: "Ricardo Lima",
        cargoId: "role-supervisor",
        type: "FIXO",
        status: "ATIVO",
        companyId: "c2",
        unitId: "u3",
        teamId: "t3",
        contatoTelefone: "5511991010108",
        pixKey: "ricardo@pix",
        paymentRuleId: "rule-shift-sup",
        performance: { dia: "VERDE", semana: 0.92, mes: 0.9 },
        createdAt: "2024-05-11T11:00:00.000Z",
        updatedAt: "2026-02-14T08:00:00.000Z"
      },
      {
        id: "p9",
        nome: "Priscila Mota",
        cargoId: "role-supervisor",
        type: "FIXO",
        status: "AFASTADO",
        companyId: "c2",
        unitId: "u4",
        teamId: "t4",
        contatoTelefone: "5511991010109",
        pixKey: "priscila@pix",
        paymentRuleId: "rule-shift-sup",
        performance: { dia: "AMARELO", semana: 0.7, mes: 0.69 },
        createdAt: "2024-05-11T11:00:00.000Z",
        updatedAt: "2026-02-10T08:00:00.000Z"
      },
      {
        id: "p10",
        nome: "Mateus Freela",
        cargoId: "role-cashier",
        type: "FREELA",
        status: "ATIVO",
        companyId: "c2",
        unitId: "u3",
        teamId: "t3",
        leaderPersonId: "p8",
        contatoTelefone: "5511991010110",
        pixKey: "mateus.freela@pix",
        paymentRuleId: "rule-hourly-retail",
        performance: { dia: "AMARELO", semana: 0.73, mes: 0.76 },
        createdAt: "2025-05-11T11:00:00.000Z",
        updatedAt: "2026-02-14T08:00:00.000Z"
      }
    ],
    documents: [
      { id: "d1", personId: "p1", tipo: "RG", status: "OK", criticidade: "BAIXA" },
      { id: "d2", personId: "p4", tipo: "Contrato Freela", status: "PENDENTE", criticidade: "ALTA" },
      { id: "d3", personId: "p6", tipo: "Comprovante Endereco", status: "PENDENTE", criticidade: "MEDIA" },
      { id: "d4", personId: "p10", tipo: "CPF", status: "OK", criticidade: "BAIXA" }
    ],
    schedules: [
      {
        id: "sc1",
        date: TODAY,
        personId: "p1",
        unidadeId: "u1",
        turns: [{ nome: "Manha", inicio: "08:00", fim: "16:00", unidadeId: "u1" }]
      },
      {
        id: "sc2",
        date: TODAY,
        personId: "p2",
        unidadeId: "u1",
        turns: [
          { nome: "Abertura", inicio: "07:00", fim: "12:00", unidadeId: "u1" },
          { nome: "Fechamento", inicio: "17:00", fim: "21:00", unidadeId: "u1" }
        ]
      },
      {
        id: "sc3",
        date: TODAY,
        personId: "p3",
        unidadeId: "u2",
        turns: [
          { nome: "Abertura", inicio: "08:00", fim: "12:00", unidadeId: "u2" },
          { nome: "Intermediario", inicio: "13:00", fim: "18:00", unidadeId: "u2" }
        ]
      },
      {
        id: "sc4",
        date: TODAY,
        personId: "p4",
        unidadeId: "u2",
        turns: [{ nome: "Integral", inicio: "09:00", fim: "18:00", unidadeId: "u2" }]
      },
      {
        id: "sc5",
        date: TODAY,
        personId: "p6",
        unidadeId: "u1",
        turns: [{ nome: "Manha", inicio: "09:00", fim: "15:00", unidadeId: "u1" }]
      },
      {
        id: "sc6",
        date: TODAY,
        personId: "p7",
        unidadeId: "u3",
        turns: [{ nome: "Tarde", inicio: "13:00", fim: "21:00", unidadeId: "u3" }]
      },
      {
        id: "sc7",
        date: TODAY,
        personId: "p8",
        unidadeId: "u3",
        turns: [
          { nome: "Abertura", inicio: "08:00", fim: "12:00", unidadeId: "u3" },
          { nome: "Fechamento", inicio: "17:00", fim: "21:00", unidadeId: "u3" }
        ]
      },
      {
        id: "sc8",
        date: TODAY,
        personId: "p10",
        unidadeId: "u3",
        turns: [{ nome: "Noite", inicio: "15:00", fim: "22:00", unidadeId: "u3" }]
      }
    ],
    hoursDays: [
      { id: "h1", date: TODAY, personId: "p1", horas: 8, fonte: "APONTAMENTO_REAL", overrideFlag: false, validado: true },
      { id: "h2", date: TODAY, personId: "p2", horas: 9, fonte: "APONTAMENTO_REAL", overrideFlag: false, validado: true },
      { id: "h3", date: TODAY, personId: "p4", horas: 8, fonte: "APONTAMENTO_REAL", overrideFlag: false, validado: false },
      { id: "h4", date: TODAY, personId: "p6", horas: 6, fonte: "APONTAMENTO_REAL", overrideFlag: true, motivoOverride: "Saiu mais cedo", validado: false },
      { id: "h5", date: TODAY, personId: "p10", horas: 7, fonte: "APONTAMENTO_REAL", overrideFlag: false, validado: false }
    ],
    additionalTypes: additionalTypes(),
    additionalDays: [
      {
        id: "a1",
        date: TODAY,
        personId: "p4",
        tipo: "TRANSPORTE",
        valor: 25,
        globalFlag: false,
        aplicarPara: "SO_FREELAS",
        pagavelViaPix: true
      },
      {
        id: "a2",
        date: TODAY,
        personId: "p1",
        tipo: "DESCONTO",
        valor: 10,
        descricao: "Ajuste uniforme",
        globalFlag: false,
        aplicarPara: "SO_FIXOS",
        pagavelViaPix: false
      }
    ],
    paymentLineStates: [
      { date: TODAY, personId: "p1", statusPago: "PENDENTE" },
      { date: TODAY, personId: "p4", statusPago: "PENDENTE" },
      { date: TODAY, personId: "p6", statusPago: "PENDENTE" },
      { date: TODAY, personId: "p10", statusPago: "PENDENTE" }
    ],
    paymentPanelConfigs: [
      {
        date: TODAY,
        mode: "CUSTO",
        fonteHoras: "ESCALA_PREVISTA",
        horasPadraoDia: 8,
        additionalGlobal: {
          tipo: "ALIMENTACAO",
          valor: 18,
          aplicarPara: "SO_FREELAS",
          pagavelViaPix: true,
          descricao: "Ajuda alimentacao"
        }
      }
    ],
    paymentDayItems: previousItems,
    dayClosures: [
      {
        id: "closure-yesterday",
        date: yesterday,
        modo: "PAGAMENTO",
        total: 420,
        fechadoPor: "u-rh-001",
        fechadoEm: "2026-02-13T23:10:00.000Z",
        itens: previousItems
      }
    ],
    communicationTemplates: [
      {
        id: "tpl1",
        companyId: "c1",
        nome: "Pendencia de documentos",
        conteudo: "Ola! Identificamos documentos pendentes no seu cadastro. Regularize ate hoje as 18h."
      },
      {
        id: "tpl2",
        companyId: "c2",
        nome: "Mudanca de escala",
        conteudo: "Sua escala de hoje foi atualizada. Confira horarios e unidade no painel."
      }
    ],
    communicationCampaigns: [],
    communicationLogs: [],
    automationRules: [
      { id: "aut1", evento: "DOC_PENDENTE", ativo: true, templateId: "tpl1" },
      { id: "aut2", evento: "ONBOARDING_ATRASADO", ativo: false },
      { id: "aut3", evento: "TREINAMENTO_VENCIDO", ativo: true },
      { id: "aut4", evento: "MUDANCA_ESCALA", ativo: false, templateId: "tpl2" },
      { id: "aut5", evento: "RECRUTAMENTO_ATRASADO", ativo: true }
    ],
    connectorWebhooks: [
      {
        id: "wh1",
        nome: "Conector Tarefas Generico",
        endpoint: "https://example.local/tasks/webhook",
        ativo: false,
        eventos: ["AVISO_DISPARADO", "RECRUTAMENTO_ATRASADO"]
      }
    ],
    connectorEvents: [],
    recruitmentVagas: [
      {
        id: "vaga1",
        companyId: "c1",
        unitId: "u2",
        teamId: "t2",
        cargoId: "role-cook",
        gestorPersonId: "p3",
        dataAbertura: "2026-02-04",
        etapaAtualId: "PUBLICACAO-3",
        diasSemAvanco: 4,
        checklist: defaultRecruitmentChecklist(TODAY)
      },
      {
        id: "vaga2",
        companyId: "c2",
        unitId: "u3",
        teamId: "t3",
        cargoId: "role-cashier",
        gestorPersonId: "p8",
        dataAbertura: "2026-02-10",
        etapaAtualId: "TRIAGEM-4",
        diasSemAvanco: 1,
        checklist: defaultRecruitmentChecklist(TODAY)
      }
    ],
    trainings: [
      { id: "tr1", nome: "Boas praticas de atendimento", cargoId: "role-attendant", obrigatorio: true, validadeDias: 180 },
      { id: "tr2", nome: "Seguranca alimentar", cargoId: "role-cook", obrigatorio: true, validadeDias: 120 },
      { id: "tr3", nome: "Venda consultiva", cargoId: "role-cashier", obrigatorio: false, validadeDias: 365 }
    ],
    trainingCompletions: [
      { id: "tc1", personId: "p1", trainingId: "tr1", status: "EM_DIA", concluidoEm: "2026-01-15" },
      { id: "tc2", personId: "p4", trainingId: "tr2", status: "PENDENTE" },
      { id: "tc3", personId: "p10", trainingId: "tr3", status: "VENCIDO", concluidoEm: "2024-11-01" }
    ],
    competencies: [
      {
        id: "comp1",
        cargoId: "role-attendant",
        nivel: "Junior",
        competencia: "Atendimento consultivo",
        peso: 3,
        criterioObservavel: "Apresenta opcoes e fecha venda com objecoes tratadas"
      },
      {
        id: "comp2",
        cargoId: "role-cook",
        nivel: "Pleno",
        competencia: "Padrao de producao",
        peso: 4,
        criterioObservavel: "Entrega dentro de padrao e tempo em 95% dos turnos"
      },
      {
        id: "comp3",
        cargoId: "role-supervisor",
        nivel: "Senior",
        competencia: "Gestao de escala",
        peso: 5,
        criterioObservavel: "Escala sem buraco critico por 4 semanas"
      }
    ],
    onboardingItems: [
      { id: "on1", cargoId: "role-attendant", marcoDia: 1, titulo: "Boas-vindas e tour", ownerRole: "RH" },
      { id: "on2", cargoId: "role-attendant", marcoDia: 7, titulo: "Checklist caixa", ownerRole: "GESTOR" },
      { id: "on3", cargoId: "role-cook", marcoDia: 14, titulo: "Padrao de producao", ownerRole: "GESTOR" },
      { id: "on4", cargoId: "role-cook", marcoDia: 30, titulo: "Avaliacao 30 dias", ownerRole: "RH" },
      { id: "on5", cargoId: "role-cashier", marcoDia: 60, titulo: "Mentoria de vendas", ownerRole: "GESTOR" },
      { id: "on6", cargoId: "role-supervisor", marcoDia: 90, titulo: "Avaliacao final", ownerRole: "RH" }
    ],
    onboardingProgress: [
      { id: "op1", personId: "p1", onboardingItemId: "on1", status: "CONCLUIDO", evidencia: "Foto assinatura" },
      { id: "op2", personId: "p4", onboardingItemId: "on3", status: "ATRASADO" },
      { id: "op3", personId: "p10", onboardingItemId: "on5", status: "PENDENTE" }
    ],
    pdiItems: [
      {
        id: "pdi1",
        personId: "p1",
        lacuna: "Conversao em horario de pico",
        acao: "Role-play semanal",
        prazo: "2026-03-10",
        responsavelPersonId: "p2",
        evolucao: "1/4 encontros realizados"
      },
      {
        id: "pdi2",
        personId: "p10",
        lacuna: "Conferencia de caixa",
        acao: "Treino pratico com supervisor",
        prazo: "2026-02-28",
        responsavelPersonId: "p8",
        evolucao: "Aguardando inicio"
      }
    ],
    coverageTargets: [
      { id: "cv1", unitId: "u1", cargoId: "role-attendant", minimoHoje: 2 },
      { id: "cv2", unitId: "u2", cargoId: "role-cook", minimoHoje: 2 },
      { id: "cv3", unitId: "u3", cargoId: "role-cashier", minimoHoje: 2 }
    ],
    permissions: permissionsByRole(),
    auditLogs: [
      {
        id: "audit-seed-1",
        actorId: "u-rh-001",
        actorName: "Patricia Operacoes",
        actorRole: "RH_OPERACAO",
        acao: "SEED_STATE",
        criadoEm: "2026-02-14T08:00:00.000Z"
      }
    ]
  };
}
