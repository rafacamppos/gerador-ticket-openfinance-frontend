import { TicketFlowState } from './open-finance-flow.models';

export type JsonRecord = Record<string, unknown>;

export type OpenFinanceTicketCategory = {
  nivel1?: string | null;
  nivel2?: string | null;
  nivel3?: string | null;
};

export type OpenFinanceTicketDescription = {
  summary?: string | null;
  full?: string | null;
};

export type OpenFinanceTicketCore = {
  id?: string | number | null;
  title?: string | null;
  status?: string | null;
  sr_type?: string | null;
  type?: string | null;
  template?: string | null;
  description?: OpenFinanceTicketDescription | null;
  category?: OpenFinanceTicketCategory | null;
};

export type OpenFinanceTicketAssignment = {
  solicitante?: string | null;
  instituicao_requerente?: string | null;
  responsavel?: string | null;
  grupo?: string | null;
  nivel_suporte_atual?: string | number | null;
};

export type OpenFinanceTicketCompany = {
  valueCaption?: string | null;
};

export type OpenFinanceTicketTimestamps = {
  criado_em?: string | number | null;
  criado_em_ms?: string | number | null;
  atualizado_em?: string | number | null;
  atualizado_em_ms?: string | number | null;
  encerrado_em?: string | number | null;
  encerrado_em_ms?: string | number | null;
};

export type OpenFinanceTicketRouting = {
  owner_slug?: string | null;
  owner_name?: string | null;
};

export type OpenFinanceApiContext = {
  endpoint?: string | null;
  http_status?: string | number | null;
  interaction_id?: string | null;
  request?: OpenFinanceApiMessage | null;
  response?: OpenFinanceApiMessage | null;
};

export type OpenFinanceApiMessage = {
  headers?: unknown;
  payload?: unknown;
};

export type OpenFinanceTicketSla = {
  sla_dias?: string | number | null;
  sla_atraso?: string | number | null;
  status?: string | null;
  due_date?: string | null;
};

export type OpenFinanceTicketAnalysis = {
  erro_tipo?: string | null;
  procedente?: string | null;
  escopo?: string | null;
  monitoramento?: string | null;
  tipo_cliente?: string | null;
};

export type OpenFinanceTicketSolution = {
  descricao?: string | null;
  workaround?: string | null;
  data_prevista_implementacao?: string | null;
  data_prevista_implementacao_ms?: string | number | null;
};

export type OpenFinanceTicketLifecycle = {
  reopen_counter?: string | number | null;
  archived?: boolean | string | null;
};

export type OpenFinanceTicketNote = {
  user_name?: string | null;
  create_date?: string | null;
  text?: string | null;
};

export type OpenFinanceTicketActivity = {
  id?: string | number | null;
  type?: string | null;
  logged_at?: string | null;
  description?: string | null;
};

export type OpenFinanceTicketAttachment = {
  id?: string | number | null;
  ticket_id?: string | number | null;
  file_id?: string | number | null;
  file_name?: string | null;
  name?: string | null;
  real_file_name?: string | null;
  download_url?: string | null;
  file_date?: string | null;
  created_at?: string | null;
};

export type OpenFinanceTicketRawField = {
  key?: string | null;
  label?: string | null;
  value?: unknown;
};

export type OpenFinanceTicketDetail = {
  ticket?: OpenFinanceTicketCore | null;
  flow?: TicketFlowState | JsonRecord | null;
  routing?: OpenFinanceTicketRouting | null;
  assignment?: OpenFinanceTicketAssignment | JsonRecord | null;
  company?: OpenFinanceTicketCompany | JsonRecord | null;
  timestamps?: OpenFinanceTicketTimestamps | JsonRecord | null;
  api_context?: OpenFinanceApiContext | JsonRecord | null;
  sla?: OpenFinanceTicketSla | JsonRecord | null;
  analysis?: OpenFinanceTicketAnalysis | JsonRecord | null;
  solution?: OpenFinanceTicketSolution | JsonRecord | null;
  lifecycle?: OpenFinanceTicketLifecycle | JsonRecord | null;
  notes?: OpenFinanceTicketNote[] | JsonRecord[] | null;
  activities?: OpenFinanceTicketActivity[] | JsonRecord[] | null;
  attachments?: OpenFinanceTicketAttachment[] | JsonRecord[] | null;
  raw_fields?: OpenFinanceTicketRawField[] | JsonRecord[] | null;
};
