import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  ApplicationIncident,
  CreateIncidentTicketPayload,
  CreateIncidentTicketResponse,
  ReportApplicationIncidentPayload,
  TicketPreview,
} from './application-incidents.models';
import {
  TicketFlowResponse,
  TicketFlowState,
  TicketFlowTransitionPayload,
} from './open-finance-flow.models';
import { OpenFinanceTicketDetail } from './open-finance-ticket.models';

type OpenFinanceEnvironment = {
  key: string;
  label: string;
  baseUrl: string;
};

type OpenFinanceEnvironmentResponse = {
  current: OpenFinanceEnvironment;
  available: OpenFinanceEnvironment[];
};

export type PortalUser = {
  id: string | null;
  name: string | null;
  email: string | null;
  profile: 'user' | 'adm' | null;
  team: {
    id: string | null;
    slug: string | null;
    name: string | null;
  } | null;
};

export type { TicketFlowResponse, TicketFlowState, TicketFlowTransitionPayload };

export type CreateTicketPayload = {
  info: Array<{
    key: string;
    value: string;
  }>;
};

export type CreateTicketResponse = {
  id: string | number;
};

export type UpdateTicketPayload = {
  id?: string;
  info: Array<{
    key: string;
    value: string;
  }>;
};

export type TicketStatusOption = {
  id: string | null;
  name: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class OpenFinanceApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  async getEnvironment(): Promise<OpenFinanceEnvironmentResponse> {
    return firstValueFrom(
      this.http.get<OpenFinanceEnvironmentResponse>(`${this.apiBaseUrl}/environment`, {
        withCredentials: true,
      })
    );
  }

  async updateEnvironment(environmentKey: string): Promise<OpenFinanceEnvironmentResponse> {
    return firstValueFrom(
      this.http.put<OpenFinanceEnvironmentResponse>(
        `${this.apiBaseUrl}/environment`,
        { environmentKey },
        {
          withCredentials: true,
        }
      )
    );
  }

  async listTickets(ownerSlug?: string): Promise<OpenFinanceTicketDetail[]> {
    const options: {
      params?: Record<string, string>;
      withCredentials: boolean;
    } = {
      withCredentials: true,
    };

    if (ownerSlug) {
      options.params = { ownerSlug };
    }

    return firstValueFrom(
      this.http.get<OpenFinanceTicketDetail[]>(
        `${this.apiBaseUrl}/tickets`,
        options
      )
    );
  }

  async listKnownTickets(ownerSlug?: string): Promise<TicketFlowState[]> {
    const options: {
      params?: Record<string, string>;
      withCredentials: boolean;
    } = {
      withCredentials: true,
    };

    if (ownerSlug) {
      options.params = { ownerSlug };
    }

    return firstValueFrom(
      this.http.get<TicketFlowState[]>(
        `${this.apiBaseUrl}/tickets/known`,
        options
      )
    );
  }

  async listTicketStatuses(): Promise<TicketStatusOption[]> {
    return firstValueFrom(
      this.http.get<TicketStatusOption[]>(`${this.apiBaseUrl}/ticket-statuses`, {
        withCredentials: true,
      })
    );
  }

  async getTicketById(ticketId: string): Promise<OpenFinanceTicketDetail> {
    return firstValueFrom(
      this.http.get<OpenFinanceTicketDetail>(
        `${this.apiBaseUrl}/tickets/${ticketId}`,
        {
          withCredentials: true,
        }
      )
    );
  }

  async createTicket(
    payload: CreateTicketPayload,
    options: { template: string; type?: string }
  ): Promise<CreateTicketResponse> {
    const params: Record<string, string> = {
      template: options.template,
      type: options.type || '1',
    };

    return firstValueFrom(
      this.http.post<CreateTicketResponse>(
        `${this.apiBaseUrl}/tickets`,
        payload,
        {
          params,
          withCredentials: true,
        }
      )
    );
  }

  async updateTicket(ticketId: string, payload: UpdateTicketPayload): Promise<unknown> {
    return firstValueFrom(
      this.http.put(
        `${this.apiBaseUrl}/tickets/${encodeURIComponent(ticketId)}`,
        payload,
        {
          withCredentials: true,
        }
      )
    );
  }

  async listApplicationIncidents(ownerSlug: string): Promise<ApplicationIncident[]> {
    return firstValueFrom(
      this.http.get<ApplicationIncident[]>(
        `${this.apiBaseUrl}/${encodeURIComponent(ownerSlug)}/application-incidents`,
        {
          withCredentials: true,
        }
      )
    );
  }

  async getApplicationIncidentById(
    ownerSlug: string,
    incidentId: string
  ): Promise<ApplicationIncident> {
    return firstValueFrom(
      this.http.get<ApplicationIncident>(
        `${this.apiBaseUrl}/${encodeURIComponent(ownerSlug)}/application-incidents/${encodeURIComponent(incidentId)}`,
        {
          withCredentials: true,
        }
      )
    );
  }

  async reportApplicationIncident(
    ownerSlug: string,
    payload: ReportApplicationIncidentPayload
  ): Promise<ApplicationIncident> {
    return firstValueFrom(
      this.http.post<ApplicationIncident>(
        `${this.apiBaseUrl}/${encodeURIComponent(ownerSlug)}/report-application-error`,
        payload,
        {
          withCredentials: true,
        }
      )
    );
  }

  async assignApplicationIncidentToMe(
    ownerSlug: string,
    incidentId: string
  ): Promise<ApplicationIncident> {
    return firstValueFrom(
      this.http.post<ApplicationIncident>(
        `${this.apiBaseUrl}/${encodeURIComponent(ownerSlug)}/application-incidents/${encodeURIComponent(incidentId)}/assign-to-me`,
        {},
        {
          withCredentials: true,
        }
      )
    );
  }

  async getTicketPreview(ownerSlug: string, incidentId: string): Promise<TicketPreview> {
    return firstValueFrom(
      this.http.get<TicketPreview>(
        `${this.apiBaseUrl}/${encodeURIComponent(ownerSlug)}/application-incidents/${encodeURIComponent(incidentId)}/ticket-preview`,
        { withCredentials: true }
      )
    );
  }

  async createIncidentTicket(
    ownerSlug: string,
    incidentId: string,
    payload: CreateIncidentTicketPayload
  ): Promise<CreateIncidentTicketResponse> {
    return firstValueFrom(
      this.http.post<CreateIncidentTicketResponse>(
        `${this.apiBaseUrl}/${encodeURIComponent(ownerSlug)}/application-incidents/${encodeURIComponent(incidentId)}/create-ticket`,
        payload,
        {
          withCredentials: true,
        }
      )
    );
  }

  async transitionApplicationIncident(
    ownerSlug: string,
    incidentId: string,
    payload: { incident_status: string; related_ticket_id?: number | null }
  ): Promise<ApplicationIncident> {
    return firstValueFrom(
      this.http.post<ApplicationIncident>(
        `${this.apiBaseUrl}/${encodeURIComponent(ownerSlug)}/application-incidents/${encodeURIComponent(incidentId)}/transitions`,
        payload,
        {
          withCredentials: true,
        }
      )
    );
  }

  async getTicketFlow(ticketId: string): Promise<TicketFlowResponse> {
    return firstValueFrom(
      this.http.get<TicketFlowResponse>(
        `${this.apiBaseUrl}/ticket-flows/${ticketId}`,
        {
          withCredentials: true,
        }
      )
    );
  }

  async transitionTicketFlow(
    ticketId: string,
    payload: TicketFlowTransitionPayload
  ): Promise<TicketFlowResponse> {
    return firstValueFrom(
      this.http.post<TicketFlowResponse>(
        `${this.apiBaseUrl}/ticket-flows/${ticketId}/transitions`,
        payload,
        {
          withCredentials: true,
        }
      )
    );
  }

  async login(email: string): Promise<PortalUser> {
    return firstValueFrom(
      this.http.post<PortalUser>(
        `${this.apiBaseUrl}/auth/login`,
        { email },
        {
          withCredentials: true,
        }
      )
    );
  }

  async getCurrentUser(): Promise<PortalUser> {
    return firstValueFrom(
      this.http.get<PortalUser>(`${this.apiBaseUrl}/auth/me`, {
        withCredentials: true,
      })
    );
  }

  async logout(): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        `${this.apiBaseUrl}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      )
    );
  }
}
