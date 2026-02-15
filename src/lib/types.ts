export type PersonType = "FIXO" | "FREELA";
export type PersonStatus = "ATIVO" | "FERIAS" | "AFASTADO" | "OFF_HOJE";
export type PaymentRuleType = "VALOR_HORA" | "DIARIA" | "TURNO";
export type PaymentMode = "CUSTO" | "PAGAMENTO";
export type HoursSource = "ESCALA_PREVISTA" | "APONTAMENTO_REAL";
export type AdditionalTypeName =
  | "TRANSPORTE"
  | "ALIMENTACAO"
  | "BONUS"
  | "DESCONTO"
  | "OUTRO";
export type PaymentStatus = "PENDENTE" | "PAGO";
export type ChecklistStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA";
export type UserRole =
  | "ADMIN_GRUPO"
  | "ADMIN_EMPRESA"
  | "RH_OPERACAO"
  | "LIDER"
  | "COLABORADOR";

export type PermissionAction =
  | "EDITAR_REMUNERACAO_REGRA"
  | "FECHAR_PAGAMENTOS_DIA"
  | "REABRIR_PAGAMENTOS_DIA"
  | "EDITAR_PIX"
  | "EDITAR_STATUS"
  | "EDITAR_ETAPAS_RECRUTAMENTO"
  | "DISPARAR_COMUNICADOS_MASSA";

export interface ActorContext {
  id: string;
  nome: string;
  role: UserRole;
  companyId?: string;
}

export interface Group {
  id: string;
  nome: string;
}

export interface Company {
  id: string;
  groupId: string;
  nome: string;
}

export interface Unit {
  id: string;
  companyId: string;
  nome: string;
}

export interface Team {
  id: string;
  unitId: string;
  nome: string;
  leaderPersonId?: string;
}

export interface Role {
  id: string;
  nome: string;
  familia: string;
  nivel: string;
  defaultType: PersonType;
  defaultPaymentRuleId: string;
}

export interface PaymentRule {
  id: string;
  companyId?: string;
  unitId?: string;
  roleId?: string;
  type: PaymentRuleType;
  valorHora?: number;
  valorDiaria?: number;
  valorTurno?: number;
  qtdTurnosPadrao?: number;
}

export interface PersonDocument {
  id: string;
  personId: string;
  tipo: string;
  status: "OK" | "PENDENTE";
  validade?: string;
  criticidade: "BAIXA" | "MEDIA" | "ALTA";
}

export interface PersonPerformance {
  dia: "VERDE" | "AMARELO" | "VERMELHO";
  semana?: number;
  mes?: number;
  observacoes?: string;
}

export interface Person {
  id: string;
  nome: string;
  fotoUrl?: string;
  cargoId: string;
  type: PersonType;
  status: PersonStatus;
  companyId: string;
  unitId: string;
  teamId: string;
  leaderPersonId?: string;
  contatoTelefone?: string;
  pixKey?: string;
  paymentRuleId?: string;
  performance: PersonPerformance;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  nome: string;
  inicio: string;
  fim: string;
  unidadeId: string;
}

export interface ScheduleDay {
  id: string;
  date: string;
  personId: string;
  turns: Shift[];
  unidadeId: string;
}

export interface HoursDay {
  id: string;
  date: string;
  personId: string;
  horas: number;
  fonte: HoursSource;
  overrideFlag: boolean;
  motivoOverride?: string;
  validado: boolean;
}

export interface AdditionalTypeConfig {
  id: string;
  nome: AdditionalTypeName;
  ativo: boolean;
  pagavelViaPixPorPadrao: boolean;
  descricaoObrigatoria: boolean;
}

export interface AdditionalDay {
  id: string;
  date: string;
  personId?: string;
  tipo: AdditionalTypeName;
  valor: number;
  descricao?: string;
  globalFlag: boolean;
  aplicarPara: "TODOS" | "SO_FREELAS" | "SO_FIXOS";
  pagavelViaPix: boolean;
}

export interface PaymentLineState {
  date: string;
  personId: string;
  statusPago: PaymentStatus;
}

export interface PaymentPanelConfig {
  date: string;
  mode: PaymentMode;
  fonteHoras: HoursSource;
  horasPadraoDia: number;
  additionalGlobal?: {
    tipo: AdditionalTypeName;
    valor: number;
    aplicarPara: "TODOS" | "SO_FREELAS" | "SO_FIXOS";
    pagavelViaPix: boolean;
    descricao?: string;
  };
}

export interface PaymentDayItem {
  id: string;
  date: string;
  personId: string;
  valorBase: number;
  adicionais: Array<{
    tipo: AdditionalTypeName;
    valor: number;
    descricao?: string;
    pagavelViaPix: boolean;
  }>;
  total: number;
  pixSnapshot?: {
    chavePix?: string;
    valor: number;
  };
  paymentRuleSnapshot: PaymentRule;
  horasSnapshot: number;
  statusPago: PaymentStatus;
}

export interface DayClosure {
  id: string;
  date: string;
  modo: PaymentMode;
  total: number;
  companyId?: string;
  unitId?: string;
  teamId?: string;
  cargoId?: string;
  fechadoPor: string;
  fechadoEm: string;
  motivoReabertura?: string;
  reabertoPor?: string;
  reabertoEm?: string;
  itens: PaymentDayItem[];
}

export interface CommunicationTemplate {
  id: string;
  companyId?: string;
  unitId?: string;
  teamId?: string;
  nome: string;
  conteudo: string;
}

export interface CommunicationCampaign {
  id: string;
  templateId?: string;
  conteudoFinal: string;
  segmentacao: {
    companyId?: string;
    unitId?: string;
    teamId?: string;
    cargoId?: string;
    tipo?: PersonType;
    status?: PersonStatus;
  };
  gatilho?:
    | "DOC_PENDENTE"
    | "ONBOARDING_ATRASADO"
    | "TREINAMENTO_VENCIDO"
    | "MUDANCA_ESCALA"
    | "RECRUTAMENTO_ATRASADO";
  criadoPor: string;
  criadoEm: string;
}

export interface CommunicationLog {
  id: string;
  campaignId: string;
  personId: string;
  enviadoEm: string;
  status: "ENVIADO" | "ENTREGUE" | "ERRO";
  templateId?: string;
}

export interface AutomationRule {
  id: string;
  evento:
    | "DOC_PENDENTE"
    | "ONBOARDING_ATRASADO"
    | "TREINAMENTO_VENCIDO"
    | "MUDANCA_ESCALA"
    | "RECRUTAMENTO_ATRASADO";
  ativo: boolean;
  templateId?: string;
}

export interface ConnectorWebhook {
  id: string;
  nome: string;
  endpoint: string;
  ativo: boolean;
  eventos: Array<"AVISO_DISPARADO" | "RECRUTAMENTO_ATRASADO" | "TREINAMENTO_VENCIDO">;
}

export interface ConnectorEvent {
  id: string;
  webhookId: string;
  evento: "AVISO_DISPARADO" | "RECRUTAMENTO_ATRASADO" | "TREINAMENTO_VENCIDO";
  payloadResumo: string;
  criadoEm: string;
}

export interface RecruitmentStage {
  id: string;
  nome: string;
  opcional?: boolean;
  ownerRole: "GESTOR" | "RH";
  prazo: string;
  evidenciaMinima: string;
  status: ChecklistStatus;
  atualizadoEm?: string;
  evidencia?: string;
}

export interface RecruitmentVaga {
  id: string;
  companyId: string;
  unitId: string;
  teamId: string;
  cargoId: string;
  gestorPersonId: string;
  dataAbertura: string;
  etapaAtualId: string;
  diasSemAvanco: number;
  checklist: RecruitmentStage[];
}

export interface Training {
  id: string;
  nome: string;
  cargoId: string;
  obrigatorio: boolean;
  validadeDias?: number;
}

export interface TrainingCompletion {
  id: string;
  personId: string;
  trainingId: string;
  status: "PENDENTE" | "EM_DIA" | "VENCIDO";
  concluidoEm?: string;
}

export interface CompetencyRole {
  id: string;
  cargoId: string;
  nivel: string;
  competencia: string;
  peso: number;
  criterioObservavel: string;
}

export interface OnboardingItem {
  id: string;
  cargoId: string;
  marcoDia: 1 | 7 | 14 | 30 | 60 | 90;
  titulo: string;
  ownerRole: "RH" | "GESTOR" | "COLABORADOR";
}

export interface OnboardingProgress {
  id: string;
  personId: string;
  onboardingItemId: string;
  status: "PENDENTE" | "CONCLUIDO" | "ATRASADO";
  evidencia?: string;
}

export interface PDIItem {
  id: string;
  personId: string;
  lacuna: string;
  acao: string;
  prazo: string;
  responsavelPersonId: string;
  evolucao: string;
  evidencia?: string;
}

export interface CoverageTarget {
  id: string;
  unitId: string;
  cargoId: string;
  minimoHoje: number;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  acao: string;
  companyId?: string;
  unitId?: string;
  before?: unknown;
  after?: unknown;
  criadoEm: string;
}

export interface AppState {
  version: number;
  updatedAt: string;
  grupo: Group;
  companies: Company[];
  units: Unit[];
  teams: Team[];
  roles: Role[];
  paymentRules: PaymentRule[];
  people: Person[];
  documents: PersonDocument[];
  schedules: ScheduleDay[];
  hoursDays: HoursDay[];
  additionalTypes: AdditionalTypeConfig[];
  additionalDays: AdditionalDay[];
  paymentLineStates: PaymentLineState[];
  paymentPanelConfigs: PaymentPanelConfig[];
  paymentDayItems: PaymentDayItem[];
  dayClosures: DayClosure[];
  communicationTemplates: CommunicationTemplate[];
  communicationCampaigns: CommunicationCampaign[];
  communicationLogs: CommunicationLog[];
  automationRules: AutomationRule[];
  connectorWebhooks: ConnectorWebhook[];
  connectorEvents: ConnectorEvent[];
  recruitmentVagas: RecruitmentVaga[];
  trainings: Training[];
  trainingCompletions: TrainingCompletion[];
  competencies: CompetencyRole[];
  onboardingItems: OnboardingItem[];
  onboardingProgress: OnboardingProgress[];
  pdiItems: PDIItem[];
  coverageTargets: CoverageTarget[];
  permissions: Record<UserRole, Record<PermissionAction, boolean>>;
  auditLogs: AuditEntry[];
}
