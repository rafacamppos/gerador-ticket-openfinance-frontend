export type ApplicationIncident = {
  id: string | null;
  team_slug: string | null;
  team_name: string | null;
  x_fapi_interaction_id: string | null;
  authorization_server: string | null;
  client_id: string | null;
  endpoint: string | null;
  method: string | null;
  error_payload: Record<string, unknown>;
  occurred_at: string | null;
  http_status_code: number | null;
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
  error_payload: Record<string, unknown>;
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
