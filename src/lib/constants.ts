import { ActorContext, AdditionalTypeName, RecruitmentStage, UserRole } from "@/lib/types";

export const MOCK_ACTOR: ActorContext = {
  id: "u-rh-001",
  nome: "Patricia Operacoes",
  role: "RH_OPERACAO",
  companyId: "c1"
};

export const FIXED_ADDITIONAL_TYPES: AdditionalTypeName[] = [
  "TRANSPORTE",
  "ALIMENTACAO",
  "BONUS",
  "DESCONTO",
  "OUTRO"
];

export const RECRUITMENT_STAGE_NAMES: Array<{
  key: string;
  nome: string;
  opcional?: boolean;
  ownerRole: "GESTOR" | "RH";
  evidenciaMinima: string;
}> = [
  {
    key: "VAGA_CRIADA",
    nome: "Vaga criada",
    ownerRole: "RH",
    evidenciaMinima: "Registro de abertura"
  },
  {
    key: "PERFIL_DEFINIDO",
    nome: "Perfil definido (scorecard)",
    ownerRole: "GESTOR",
    evidenciaMinima: "Scorecard ou notas"
  },
  {
    key: "PUBLICACAO",
    nome: "Publicacao feita (canais)",
    ownerRole: "RH",
    evidenciaMinima: "Checklist de canais"
  },
  {
    key: "TRIAGEM",
    nome: "Triagem encaminhada (WhatsApp)",
    ownerRole: "RH",
    evidenciaMinima: "Mensagem ou link"
  },
  {
    key: "ENTREVISTA",
    nome: "Entrevista estruturada",
    ownerRole: "GESTOR",
    opcional: true,
    evidenciaMinima: "Resumo da entrevista"
  },
  {
    key: "OFERTA",
    nome: "Oferta enviada",
    ownerRole: "RH",
    evidenciaMinima: "Comprovante de oferta"
  },
  {
    key: "DOCUMENTACAO",
    nome: "Documentacao coletada",
    ownerRole: "RH",
    evidenciaMinima: "Arquivos recebidos"
  },
  {
    key: "ENCERRAMENTO",
    nome: "Contratado / Encerrado",
    ownerRole: "GESTOR",
    evidenciaMinima: "Status final"
  }
];

export function defaultRecruitmentChecklist(today: string): RecruitmentStage[] {
  return RECRUITMENT_STAGE_NAMES.map((stage, idx) => ({
    id: `${stage.key}-${idx + 1}`,
    nome: stage.nome,
    ownerRole: stage.ownerRole,
    opcional: stage.opcional,
    evidenciaMinima: stage.evidenciaMinima,
    prazo: today,
    status: idx === 0 ? "CONCLUIDA" : "PENDENTE"
  }));
}

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN_GRUPO: "Admin Grupo",
  ADMIN_EMPRESA: "Admin Empresa",
  RH_OPERACAO: "RH/Operacao",
  LIDER: "Lider",
  COLABORADOR: "Colaborador"
};
