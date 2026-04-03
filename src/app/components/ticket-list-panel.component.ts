import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';

import { TicketStatusOption } from '../services/open-finance-api.service';
import {
  OpenFinanceTicketService,
  TicketListItem,
} from '../services/open-finance-ticket.service';
import { SkeletonLoaderComponent } from './skeleton-loader.component';
import { IconComponent } from './icon.component';

type TicketTab = 'mine' | 'received';
type TicketStatusFilterOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-ticket-list-panel',
  standalone: true,
  imports: [FormsModule, NgClass, SkeletonLoaderComponent, IconComponent],
  templateUrl: './ticket-list-panel.component.html',
  styleUrl: './ticket-list-panel.component.css',
})
export class TicketListPanelComponent implements OnChanges {
  @Input({ required: true }) ownerSlug = '';
  @Input() tickets: TicketListItem[] = [];
  @Input() isLoading = false;
  @Input() hasSearched = false;
  @Input() errorMessage = '';
  @Input() ticketStatuses: TicketStatusOption[] = [];
  @Input() isLoadingTicketStatuses = false;
  @Input() ticketStatusError = '';
  @Input() initialMessage = 'Nenhum ticket foi carregado para esta area.';
  @Input() emptySearchMessage = 'Nenhum ticket foi localizado para esta area.';
  @Output() receivedTicketsOpen = new EventEmitter<void>();

  protected readonly pageSize = 10;
  protected currentPage = 1;
  protected activeTab: TicketTab = 'mine';
  protected selectedMineTicketStatus = '';
  protected selectedReceivedTicketStatus = '';

  constructor(
    private readonly ticketService: OpenFinanceTicketService,
    private readonly router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tickets']) {
      this.currentPage = 1;
      this.ensureValidTab();
    }
  }

  protected get totalPages(): number {
    return Math.max(1, Math.ceil(this.activeTickets.length / this.pageSize));
  }

  protected get paginatedTickets(): TicketListItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.activeTickets.slice(startIndex, startIndex + this.pageSize);
  }

  protected get myTickets(): TicketListItem[] {
    return this.tickets.filter((ticket) => this.isMine(ticket));
  }

  protected get receivedTickets(): TicketListItem[] {
    return this.tickets.filter((ticket) => !this.isMine(ticket));
  }

  protected get filteredReceivedTickets(): TicketListItem[] {
    if (!this.selectedReceivedTicketStatus) {
      return this.receivedTickets;
    }

    return this.receivedTickets.filter(
      (ticket) => this.resolveTicketStatus(ticket) === this.selectedReceivedTicketStatus
    );
  }

  protected get filteredMyTickets(): TicketListItem[] {
    if (!this.selectedMineTicketStatus) {
      return this.myTickets;
    }

    return this.myTickets.filter(
      (ticket) => this.resolveTicketStatus(ticket) === this.selectedMineTicketStatus
    );
  }

  protected get receivedTicketStatusOptions(): TicketStatusFilterOption[] {
    return this.buildStatusOptions(this.receivedTickets);
  }

  protected get myTicketStatusOptions(): TicketStatusFilterOption[] {
    return this.buildStatusOptions(this.myTickets);
  }

  protected get activeTickets(): TicketListItem[] {
    return this.activeTab === 'mine' ? this.filteredMyTickets : this.filteredReceivedTickets;
  }

  protected get activeTicketCount(): number {
    return this.activeTab === 'mine' ? this.myTickets.length : this.receivedTickets.length;
  }

  protected get selectedActiveTicketStatus(): string {
    return this.activeTab === 'mine'
      ? this.selectedMineTicketStatus
      : this.selectedReceivedTicketStatus;
  }

  protected get activeTicketStatusOptions(): TicketStatusFilterOption[] {
    return this.activeTab === 'mine'
      ? this.myTicketStatusOptions
      : this.receivedTicketStatusOptions;
  }

  protected onActiveTicketStatusChange(value: string): void {
    if (this.activeTab === 'mine') {
      this.selectedMineTicketStatus = value;
    } else {
      this.selectedReceivedTicketStatus = value;
    }

    this.currentPage = 1;
  }

  protected get showTicketStatusFilter(): boolean {
    return this.isActiveTab('mine') || this.isActiveTab('received');
  }

  protected statusFilterLabel(): string {
    return this.isActiveTab('mine') ? 'Meus chamados' : 'Recebidos';
  }

  protected totalActivePages(): number {
    return this.totalPages;
  }

  private buildStatusOptions(tickets: TicketListItem[]): TicketStatusFilterOption[] {
    const countsByStatus = new Map<string, number>();

    for (const ticket of tickets) {
      const status = this.resolveTicketStatus(ticket);
      countsByStatus.set(status, (countsByStatus.get(status) || 0) + 1);
    }

    return this.ticketStatuses.map((status) => {
      const value = status.name || '';
      const total = countsByStatus.get(value) || 0;

      return {
        value,
        label: `${value || 'Sem status'} (${total})`,
      };
    });
  }

  protected selectTab(tab: TicketTab): void {
    this.activeTab = tab;
    this.currentPage = 1;

    if (tab === 'received') {
      this.receivedTicketsOpen.emit();
    } else {
      this.receivedTicketsOpen.emit();
    }
  }

  protected isActiveTab(tab: TicketTab): boolean {
    return this.activeTab === tab;
  }

  protected previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  protected nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  protected pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  protected flowStageLabel(ticket: TicketListItem): string {
    return ticket.flow?.current_stage_label || 'Fluxo pendente';
  }

  protected resolveTicketStatus(ticket: TicketListItem): string {
    return ticket.flow?.ticket_status || ticket.status || 'Sem status';
  }

  protected ticketQueryParams(): Record<string, string> {
    return this.ownerSlug ? { ownerSlug: this.ownerSlug } : {};
  }

  protected async openTicket(ticketId: string): Promise<void> {
    await this.router.navigate(['/tickets', ticketId], {
      queryParams: this.ticketQueryParams(),
    });
  }

  private isMine(ticket: TicketListItem): boolean {
    return this.ticketService.isSantanderRequester(ticket.requesterInstitution);
  }

  private ensureValidTab(): void {
    if (this.activeTab === 'mine' && this.filteredMyTickets.length) {
      return;
    }

    if (this.activeTab === 'received' && this.filteredReceivedTickets.length) {
      return;
    }

    this.activeTab = this.myTickets.length ? 'mine' : 'received';
  }

  protected statusBadgeClass(ticket: TicketListItem): string {
    const status = (this.resolveTicketStatus(ticket) ?? '').toLowerCase();
    if (/aberto|novo|new/.test(status)) return 'badge--status-open';
    if (/andamento|an[aá]lise|progresso/.test(status)) return 'badge--status-in-progress';
    if (/aguardando|pendente|waiting/.test(status)) return 'badge--status-waiting';
    if (/resolvido|respondido|resolved/.test(status)) return 'badge--status-resolved';
    if (/fechado|encerrado|closed/.test(status)) return 'badge--status-closed';
    if (/cancelado|recusado|rejected/.test(status)) return 'badge--status-cancelled';
    return 'badge--status-unknown';
  }
}
