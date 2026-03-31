export type TicketFlowState = {
  ticket_id: string | null;
  ticket_title: string | null;
  ticket_status: string | null;
  current_stage: string | null;
  current_stage_label: string | null;
  current_owner_slug: string | null;
  current_owner_name: string | null;
  assigned_owner_slug: string | null;
  assigned_owner_name: string | null;
  accepted_by_team: boolean;
  responded_by_team: boolean;
  returned_to_su: boolean;
  last_actor_name: string | null;
  last_actor_email: string | null;
  last_action: string | null;
  last_action_label: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type TicketFlowEvent = {
  id: number | null;
  ticket_id: string | null;
  action: string | null;
  action_label: string | null;
  from_stage: string | null;
  from_stage_label: string | null;
  to_stage: string | null;
  to_stage_label: string | null;
  from_owner_slug: string | null;
  to_owner_slug: string | null;
  actor_name: string | null;
  actor_email: string | null;
  note: string | null;
  payload_json: Record<string, unknown>;
  created_at: string | null;
};

export type TicketFlowResponse = {
  state: TicketFlowState | null;
  events: TicketFlowEvent[];
};

export type TicketFlowTransitionPayload = {
  action: string;
  actorName?: string;
  actorEmail?: string;
  note?: string;
  targetOwnerSlug?: string;
  targetOwnerName?: string;
  ticketTitle?: string;
  ticketStatus?: string;
};

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value);
}

export function toTicketFlowState(value: unknown): TicketFlowState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const flow = value as Record<string, unknown>;
  return {
    ticket_id: asNullableString(flow['ticket_id']),
    ticket_title: asNullableString(flow['ticket_title']),
    ticket_status: asNullableString(flow['ticket_status']),
    current_stage: asNullableString(flow['current_stage']),
    current_stage_label: asNullableString(flow['current_stage_label']),
    current_owner_slug: asNullableString(flow['current_owner_slug']),
    current_owner_name: asNullableString(flow['current_owner_name']),
    assigned_owner_slug: asNullableString(flow['assigned_owner_slug']),
    assigned_owner_name: asNullableString(flow['assigned_owner_name']),
    accepted_by_team: Boolean(flow['accepted_by_team']),
    responded_by_team: Boolean(flow['responded_by_team']),
    returned_to_su: Boolean(flow['returned_to_su']),
    last_actor_name: asNullableString(flow['last_actor_name']),
    last_actor_email: asNullableString(flow['last_actor_email']),
    last_action: asNullableString(flow['last_action']),
    last_action_label: asNullableString(flow['last_action_label']),
    created_at: asNullableString(flow['created_at']),
    updated_at: asNullableString(flow['updated_at']),
  };
}
