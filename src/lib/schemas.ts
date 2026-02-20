/**
 * B People — Zod Validation Schemas
 * Type-safe validation for all API inputs/outputs.
 * Ready for tRPC or API route integration.
 */

import { z } from "zod";

// ── Enums ────────────────────────────────

export const PersonTypeSchema = z.enum(["FIXO", "FREELA"]);
export const PersonStatusSchema = z.enum(["ATIVO", "FERIAS", "AFASTADO", "OFF_HOJE"]);
export const RoleSchema = z.enum(["ADMIN", "GERENTE", "RH"]);

export const CommunicationStatusSchema = z.enum(["PENDENTE", "ENVIADO", "ENTREGUE", "LIDO", "ERRO"]);
export const AutomationEventSchema = z.enum([
    "DOC_PENDENTE", "PIX_AUSENTE", "ANIVERSARIO", "FERIAS_PROXIMAS", "TREINAMENTO_VENCIDO",
]);

export const PaymentModeSchema = z.enum(["CUSTO", "PAGAMENTO"]);
export const HoursSourceSchema = z.enum(["ESCALA_PREVISTA", "APONTAMENTO"]);
export const AdditionalTargetSchema = z.enum(["SO_FREELAS", "SO_FIXOS", "TODOS"]);

// ── Core Entities ────────────────────────

export const CompanySchema = z.object({
    id: z.string().uuid().optional(),
    nome: z.string().min(1, "Nome obrigatório").max(120),
    cnpj: z.string().optional(),
    ativo: z.boolean().default(true),
});

export const UnitSchema = z.object({
    id: z.string().uuid().optional(),
    companyId: z.string().uuid(),
    nome: z.string().min(1, "Nome obrigatório").max(120),
});

export const TeamSchema = z.object({
    id: z.string().uuid().optional(),
    unitId: z.string().uuid(),
    nome: z.string().min(1, "Nome obrigatório").max(120),
});

export const JobRoleSchema = z.object({
    id: z.string().uuid().optional(),
    nome: z.string().min(1).max(80),
    nivel: z.string().optional(),
    area: z.string().optional(),
});

export const PersonSchema = z.object({
    id: z.string().uuid().optional(),
    nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(120),
    cpf: z.string().optional(),
    email: z.string().email("Email inválido").optional(),
    telefone: z.string().optional(),
    type: PersonTypeSchema,
    status: PersonStatusSchema.default("ATIVO"),
    companyId: z.string().uuid(),
    unitId: z.string().uuid(),
    teamId: z.string().uuid().optional(),
    cargoId: z.string().uuid(),
    dataAdmissao: z.string().optional(),
    dataNascimento: z.string().optional(),
    pix: z.string().optional(),
    valorHora: z.number().min(0).optional(),
    foto: z.string().url().optional(),
});

export const ScheduleEntrySchema = z.object({
    id: z.string().uuid().optional(),
    personId: z.string().uuid(),
    unitId: z.string().uuid(),
    roleId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
    turno: z.string(),
    inicio: z.string(),
    fim: z.string(),
});

// ── Communications ───────────────────────

export const TemplateSchema = z.object({
    id: z.string().uuid().optional(),
    nome: z.string().min(1).max(100),
    conteudo: z.string().min(1, "Conteúdo obrigatório"),
    companyId: z.string().uuid().optional(),
    unitId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
});

export const SegmentacaoSchema = z.object({
    companyId: z.string().uuid().optional(),
    unitId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    cargoId: z.string().uuid().optional(),
    tipo: PersonTypeSchema.optional(),
    status: PersonStatusSchema.optional(),
});

export const SendCommunicationSchema = z.object({
    templateId: z.string().uuid().optional(),
    conteudoFinal: z.string().min(1, "Mensagem não pode ser vazia"),
    segmentacao: SegmentacaoSchema,
    gatilho: z.string().optional(),
});

// ── Webhook ──────────────────────────────

export const WebhookEventSchema = z.enum([
    "AVISO_DISPARADO", "RECRUTAMENTO_ATRASADO", "TREINAMENTO_VENCIDO",
]);

export const WebhookSchema = z.object({
    id: z.string().uuid().optional(),
    nome: z.string().min(1),
    endpoint: z.string().url("URL inválida"),
    ativo: z.boolean().default(false),
    eventos: z.array(WebhookEventSchema).min(1, "Selecione ao menos um evento"),
});

// ── Auth / Login ─────────────────────────

export const LoginSchema = z.object({
    email: z.string().email("Email inválido"),
    senha: z.string().min(4, "Senha deve ter ao menos 4 caracteres"),
});

// ── Payments ─────────────────────────────

export const PaymentConfigSchema = z.object({
    mode: PaymentModeSchema,
    fonteHoras: HoursSourceSchema,
    horasPadraoDia: z.number().min(0).max(24),
});

export const AdditionalSchema = z.object({
    tipo: z.string(),
    valor: z.number().min(0),
    aplicarPara: AdditionalTargetSchema,
    pagavelViaPix: z.boolean().default(true),
    descricao: z.string().optional(),
});

// ── Competencies ─────────────────────────

export const CompetencyScoreSchema = z.object({
    personId: z.string().uuid(),
    competencia: z.string(),
    nota: z.number().min(1).max(5),
    feedback: z.string().optional(),
});

// ── API Response Wrapper ────────────────

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: z.string().optional(),
        meta: z.object({
            total: z.number().optional(),
            page: z.number().optional(),
            limit: z.number().optional(),
        }).optional(),
    });

// ── Type Exports ─────────────────────────

export type PersonInput = z.infer<typeof PersonSchema>;
export type CompanyInput = z.infer<typeof CompanySchema>;
export type UnitInput = z.infer<typeof UnitSchema>;
export type TeamInput = z.infer<typeof TeamSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type SendCommunicationInput = z.infer<typeof SendCommunicationSchema>;
export type WebhookInput = z.infer<typeof WebhookSchema>;
export type TemplateInput = z.infer<typeof TemplateSchema>;
export type SegmentacaoInput = z.infer<typeof SegmentacaoSchema>;
export type CompetencyScoreInput = z.infer<typeof CompetencyScoreSchema>;
