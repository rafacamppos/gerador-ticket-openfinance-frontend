import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { OpenFinanceApiService } from './open-finance-api.service';
import {
  OpenFinanceTicketService,
  TicketListItem,
} from './open-finance-ticket.service';
import { TicketStatusOption } from './open-finance-api.service';

type LoadTicketsOptions = {
  apiOwnerSlug?: string;
  cacheOwnerSlug: string;
  existingTickets?: TicketListItem[] | (() => TicketListItem[]);
};

@Injectable({
  providedIn: 'root',
})
export class TicketListFacadeService {
  private readonly openFinanceApi = inject(OpenFinanceApiService);
  private readonly ticketService = inject(OpenFinanceTicketService);

  getCachedTickets(ownerSlug: string): TicketListItem[] {
    return this.ticketService.getTickets(ownerSlug);
  }

  hasFreshTickets(ownerSlug: string): boolean {
    return this.ticketService.hasFreshTickets(ownerSlug);
  }

  setCachedTickets(ownerSlug: string, tickets: TicketListItem[]): void {
    this.ticketService.setTickets(ownerSlug, tickets);
  }

  async loadTickets(options: LoadTicketsOptions): Promise<TicketListItem[]> {
    const payload = await this.openFinanceApi.listTickets(options.apiOwnerSlug);
    const syncedTickets = this.ticketService.mapTicketListPayload(payload);
    const existing = typeof options.existingTickets === 'function'
      ? options.existingTickets()
      : (options.existingTickets || []);
    const tickets = this.ticketService.mergeTickets(existing, syncedTickets);
    this.ticketService.setTickets(options.cacheOwnerSlug, tickets);
    return tickets;
  }

  async loadKnownTickets(ownerSlug: string): Promise<TicketListItem[]> {
    const payload = await this.openFinanceApi.listKnownTickets(ownerSlug);
    return this.ticketService.mapKnownTicketListPayload(payload);
  }

  async preloadKnownTickets(ownerSlug: string): Promise<TicketListItem[]> {
    if (!ownerSlug) {
      return [];
    }

    const knownTickets = await this.loadKnownTickets(ownerSlug);
    this.ticketService.setTickets(ownerSlug, knownTickets);
    return knownTickets;
  }

  async loadTicketStatuses(): Promise<TicketStatusOption[]> {
    return this.openFinanceApi.listTicketStatuses();
  }

  getLoadErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Nao foi possivel renovar a sessao automaticamente na integracao Open Finance.';
    }

    if (error instanceof HttpErrorResponse) {
      return `Falha ao consultar tickets (${error.status}).`;
    }

    return error instanceof Error ? error.message : 'Nao foi possivel consultar tickets.';
  }
}
