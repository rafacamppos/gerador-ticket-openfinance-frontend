import { Injectable } from '@angular/core';

import { TicketFlowState, toTicketFlowState } from './open-finance-flow.models';
import {
  OpenFinanceTicketAssignment,
  OpenFinanceTicketCategory,
  OpenFinanceTicketCompany,
  OpenFinanceTicketCore,
  OpenFinanceTicketDescription,
  OpenFinanceTicketDetail,
  OpenFinanceTicketTimestamps,
} from './open-finance-ticket.models';

export type TicketListItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  ticketType: string;
  template: string;
  categoryNivel1: string;
  categoryNivel2: string;
  categoryNivel3: string;
  assignmentGroup: string;
  requesterInstitution: string;
  criadoEm: string;
  criadoEmMs: number;
  atualizadoEm: string;
  atualizadoEmMs: number;
  flow: TicketFlowState | null;
};

type TicketCacheEntry = {
  tickets: TicketListItem[];
  fetchedAt: number;
};

@Injectable({
  providedIn: 'root',
})
export class OpenFinanceTicketService {
  private readonly storageKey = 'open-finance-ticket-list-v3';
  private readonly defaultTtlMs = 120000;
  private cache = this.loadStoredTickets();

  getTickets(ownerSlug: string): TicketListItem[] {
    return this.cache[ownerSlug]?.tickets || [];
  }

  getFetchedAt(ownerSlug: string): number {
    return this.cache[ownerSlug]?.fetchedAt || 0;
  }

  hasFreshTickets(ownerSlug: string, ttlMs = this.defaultTtlMs): boolean {
    const fetchedAt = this.getFetchedAt(ownerSlug);
    return Boolean(fetchedAt) && Date.now() - fetchedAt < ttlMs;
  }

  setTickets(ownerSlug: string, tickets: TicketListItem[]): void {
    this.cache[ownerSlug] = {
      tickets,
      fetchedAt: Date.now(),
    };
    sessionStorage.setItem(this.storageKey, JSON.stringify(this.cache));
  }

  clearCache(): void {
    this.cache = {};
    sessionStorage.removeItem(this.storageKey);
  }

  mapTicketListPayload(payload: OpenFinanceTicketDetail[] | unknown): TicketListItem[] {
    const items: OpenFinanceTicketDetail[] = Array.isArray(payload) ? payload : [];

    return this.sortTickets(items.map((ticket) => this.mapTicketItem(ticket)));
  }

  mapKnownTicketListPayload(payload: TicketFlowState[] | unknown): TicketListItem[] {
    const items: TicketFlowState[] = Array.isArray(payload) ? payload : [];

    return this.sortTickets(
      items.map((flowState) => ({
        id: String(flowState.ticket_id ?? ''),
        title: String(flowState.ticket_title ?? 'Ticket conhecido'),
        description: 'Dados locais conhecidos. Atualizando detalhes...',
        status: String(flowState.ticket_status ?? 'Sem status'),
        type: 'Sem tipo de registro',
        ticketType: 'Sem tipo',
        template: 'Sem template',
        categoryNivel1: 'Sem categoria',
        categoryNivel2: 'Sem subcategoria',
        categoryNivel3: 'Sem nivel 3',
        assignmentGroup: String(flowState.current_owner_name ?? 'Sem grupo'),
        requesterInstitution: '',
        criadoEm: this.formatDateTime(flowState.created_at),
        criadoEmMs: this.resolveDateMs(null, flowState.created_at),
        atualizadoEm: this.formatDateTime(flowState.updated_at ?? flowState.created_at),
        atualizadoEmMs: this.resolveDateMs(null, flowState.updated_at ?? flowState.created_at),
        flow: toTicketFlowState(flowState),
      }))
    );
  }

  mergeTickets(existingTickets: TicketListItem[], syncedTickets: TicketListItem[]): TicketListItem[] {
    const mergedById = new Map<string, TicketListItem>();

    for (const ticket of existingTickets) {
      if (ticket?.id) {
        mergedById.set(ticket.id, ticket);
      }
    }

    for (const ticket of syncedTickets) {
      if (ticket?.id) {
        mergedById.set(ticket.id, ticket);
      }
    }

    return this.sortTickets(Array.from(mergedById.values()));
  }

  isSantanderRequester(requesterInstitution: string): boolean {
    return (
      this.normalizeInstitutionName(requesterInstitution) ===
      this.normalizeInstitutionName('BCO SANTANDER (BRASIL) S.A.')
    );
  }

  private mapTicketItem(ticket: OpenFinanceTicketDetail): TicketListItem {
    const ticketPayload: OpenFinanceTicketCore | null | undefined = ticket.ticket;
    const ticketCategory: OpenFinanceTicketCategory | null | undefined = ticketPayload?.category;
    const assignmentPayload: OpenFinanceTicketAssignment | null | undefined =
      this.asAssignment(ticket.assignment);
    const companyPayload: OpenFinanceTicketCompany | null | undefined = this.asCompany(ticket.company);
    const timestampsPayload: OpenFinanceTicketTimestamps | null | undefined =
      this.asTimestamps(ticket.timestamps);
    const descriptionPayload: OpenFinanceTicketDescription | null | undefined =
      ticketPayload?.description;

    return {
      id: String(ticketPayload?.id ?? ''),
      title: String(ticketPayload?.title ?? 'Sem titulo'),
      description: String(
        descriptionPayload?.summary ?? descriptionPayload?.full ?? 'Sem descricao'
      ),
      status: String(ticketPayload?.status ?? 'Sem status'),
      type: String(ticketPayload?.sr_type ?? 'Sem tipo de registro'),
      ticketType: String(ticketPayload?.type ?? 'Sem tipo'),
      template: String(ticketPayload?.template ?? 'Sem template'),
      categoryNivel1: String(ticketCategory?.nivel1 ?? 'Sem categoria'),
      categoryNivel2: String(ticketCategory?.nivel2 ?? 'Sem subcategoria'),
      categoryNivel3: String(ticketCategory?.nivel3 ?? 'Sem nivel 3'),
      assignmentGroup: String(assignmentPayload?.grupo ?? 'Sem grupo'),
      requesterInstitution: String(
        assignmentPayload?.instituicao_requerente ?? companyPayload?.valueCaption ?? ''
      ),
      criadoEm: this.formatDateTime(timestampsPayload?.criado_em),
      criadoEmMs: this.resolveDateMs(
        timestampsPayload?.criado_em_ms,
        timestampsPayload?.criado_em
      ),
      atualizadoEm: this.formatDateTime(
        timestampsPayload?.atualizado_em ?? timestampsPayload?.criado_em
      ),
      atualizadoEmMs: this.resolveDateMs(
        timestampsPayload?.atualizado_em_ms ?? timestampsPayload?.criado_em_ms,
        timestampsPayload?.atualizado_em ?? timestampsPayload?.criado_em
      ),
      flow: this.mapFlow(ticket.flow),
    };
  }

  private mapFlow(value: unknown): TicketFlowState | null {
    return toTicketFlowState(value);
  }

  private sortTickets(tickets: TicketListItem[]): TicketListItem[] {
    return tickets
      .filter((ticket) => Boolean(ticket?.id))
      .sort((left, right) => {
        const rightReference = right.atualizadoEmMs || right.criadoEmMs || 0;
        const leftReference = left.atualizadoEmMs || left.criadoEmMs || 0;
        if (rightReference !== leftReference) {
          return rightReference - leftReference;
        }

        return (right.criadoEmMs || 0) - (left.criadoEmMs || 0);
      });
  }

  private formatDateTime(value: unknown): string {
    if (!value) {
      return 'Sem data';
    }

    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }

  private resolveDateMs(primaryValue: unknown, fallbackValue: unknown): number {
    const primary = this.parseDateMs(primaryValue);
    if (primary) {
      return primary;
    }

    return this.parseDateMs(fallbackValue);
  }

  private parseDateMs(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return 0;
      }

      if (/^\d+$/.test(trimmed)) {
        return Number(trimmed);
      }

      const parsed = Date.parse(trimmed);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return 0;
  }

  private asAssignment(value: OpenFinanceTicketDetail['assignment']): OpenFinanceTicketAssignment | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as OpenFinanceTicketAssignment)
      : null;
  }

  private asCompany(value: OpenFinanceTicketDetail['company']): OpenFinanceTicketCompany | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as OpenFinanceTicketCompany)
      : null;
  }

  private asTimestamps(
    value: OpenFinanceTicketDetail['timestamps']
  ): OpenFinanceTicketTimestamps | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as OpenFinanceTicketTimestamps)
      : null;
  }

  private normalizeInstitutionName(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  private loadStoredTickets(): Record<string, TicketCacheEntry> {
    try {
      const rawValue = sessionStorage.getItem(this.storageKey);
      if (!rawValue) {
        return {};
      }

      const parsed = JSON.parse(rawValue);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
}
