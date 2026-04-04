export const TIPO_CLIENTE_OPTIONS = ['PF', 'PJ'] as const;
export type TipoCliente = (typeof TIPO_CLIENTE_OPTIONS)[number];

export const CANAL_JORNADA_OPTIONS = [
  'App to app',
  'App to browser',
  'Browser to browser',
  'Browser to app',
  'Não se aplica',
] as const;
export type CanalJornada = (typeof CANAL_JORNADA_OPTIONS)[number];

export type TicketContext = {
  destinatario: string | null;
  category_name: string | null;
  sub_category_name: string | null;
  third_level_category_name: string | null;
  template_id: string | null;
  template_type: number | null;
  api_name_version: string | null;
  api_version: string | null;
  product_feature: string | null;
  stage_name_version: string | null;
};

export type ApplicationIncident = {
  id: string | null;
  team_slug: string | null;
  team_name: string | null;
  x_fapi_interaction_id: string | null;
  authorization_server: string | null;
  client_id: string | null;
  endpoint: string | null;
  method: string | null;
  title: string | null;
  description: string | null;
  tipo_cliente: TipoCliente | null;
  canal_jornada: CanalJornada | null;
  payload_request: Record<string, unknown>;
  payload_response: Record<string, unknown>;
  occurred_at: string | null;
  http_status_code: number | null;
  ticket_context: TicketContext | null;
  incident_status: string | null;
  incident_status_label: string | null;
  related_ticket_id: string | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ReportApplicationIncidentPayload = {
  x_fapi_interaction_id: string;
  authorization_server: string;
  client_id: string;
  endpoint: string;
  method: string;
  title: string;
  description: string;
  tipo_cliente: TipoCliente;
  canal_jornada: CanalJornada;
  payload_request: Record<string, unknown>;
  payload_response: Record<string, unknown>;
  occurred_at: string;
  http_status_code: number;
};

export type ApplicationIncidentListItem = {
  id: string;
  endpoint: string;
  method: string;
  incidentStatus: string | null;
  statusCodeLabel: string;
  incidentStatusLabel: string;
  relatedTicketId: string | null;
  summary: string;
  dataHora: string;
  dataHoraMs: number;
  createdAt: string;
  createdAtMs: number;
};

export type CreateIncidentTicketPayload = Record<string, never>;

export type CreateIncidentTicketResponse = {
  incident: ApplicationIncident;
  ticket_id: string | null;
  ticket: Record<string, unknown>;
};
