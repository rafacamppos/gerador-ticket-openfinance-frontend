import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TicketStatusOption } from '../services/open-finance-api.service';
import { TicketListItem } from '../services/open-finance-ticket.service';
import { TicketListPanelComponent } from '../components/ticket-list-panel.component';
import { TicketListFacadeService } from '../services/ticket-list-facade.service';
import { TeamWorkspaceHeaderComponent } from '../components/team-workspace-header.component';
import { OWNER_TITLES } from '../ticket-owners';

@Component({
  selector: 'app-ticket-owner-page',
  standalone: true,
  imports: [TicketListPanelComponent, TeamWorkspaceHeaderComponent],
  templateUrl: './ticket-owner-page.component.html',
  styleUrl: './ticket-owner-page.component.css',
})
export class TicketOwnerPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketListFacade = inject(TicketListFacadeService);
  private readonly refreshIntervalMs = 300000;
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;
  private routeSubscription: Subscription | null = null;
  private activeLoadVersion = 0;
  private readonly isLoadingTicketsState = signal(false);
  private readonly isRefreshingTicketsState = signal(false);
  private readonly ticketRequestErrorState = signal('');
  private readonly ticketsState = signal<TicketListItem[]>([]);
  private readonly hasSearchedState = signal(false);
  protected ticketStatuses: TicketStatusOption[] = [];
  protected isLoadingTicketStatuses = false;
  protected ticketStatusError = '';
  protected readonly ownerSlug = signal(this.route.snapshot.paramMap.get('ownerSlug') ?? '');
  protected readonly ownerTitle = computed(
    () => OWNER_TITLES[this.ownerSlug()] ?? 'Area de Tickets'
  );

  protected get isLoadingTickets(): boolean {
    return this.isLoadingTicketsState();
  }

  protected get isRefreshingTickets(): boolean {
    return this.isRefreshingTicketsState();
  }

  protected get ticketRequestError(): string {
    return this.ticketRequestErrorState();
  }

  protected get tickets(): TicketListItem[] {
    return this.ticketsState();
  }

  protected get hasSearched(): boolean {
    return this.hasSearchedState();
  }

  protected async openReceivedTickets(): Promise<void> {
    await this.loadTicketStatuses();
  }

  async ngOnInit(): Promise<void> {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const nextOwnerSlug = params.get('ownerSlug') ?? '';
      void this.handleOwnerChange(nextOwnerSlug);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.routeSubscription = null;

    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  protected async loadTickets(backgroundRefresh = false): Promise<void> {
    await this.loadTicketsForOwner(this.ownerSlug(), this.activeLoadVersion, backgroundRefresh);
  }

  private async loadTicketsForOwner(
    ownerSlug: string,
    loadVersion: number,
    backgroundRefresh = false
  ): Promise<void> {
    if (backgroundRefresh) {
      this.isRefreshingTicketsState.set(true);
    } else {
      this.isLoadingTicketsState.set(true);
    }
    this.ticketRequestErrorState.set('');
    this.hasSearchedState.set(true);

    try {
      const tickets = await this.ticketListFacade.loadTickets({
        apiOwnerSlug: ownerSlug,
        cacheOwnerSlug: ownerSlug,
        existingTickets: this.ticketsState(),
      });

      if (!this.isCurrentLoad(ownerSlug, loadVersion)) {
        return;
      }

      this.ticketsState.set(tickets);
    } catch (error) {
      if (!this.isCurrentLoad(ownerSlug, loadVersion)) {
        return;
      }

      this.ticketRequestErrorState.set(this.ticketListFacade.getLoadErrorMessage(error));
    } finally {
      if (!this.isCurrentLoad(ownerSlug, loadVersion)) {
        return;
      }

      if (backgroundRefresh) {
        this.isRefreshingTicketsState.set(false);
      } else {
        this.isLoadingTicketsState.set(false);
      }
    }
  }

  private async hydrateKnownTickets(ownerSlug: string, loadVersion: number): Promise<boolean> {
    try {
      const knownTickets = await this.ticketListFacade.loadKnownTickets(ownerSlug);
      if (
        !this.isCurrentLoad(ownerSlug, loadVersion) ||
        !knownTickets.length ||
        this.ticketsState().length
      ) {
        return false;
      }

      this.ticketsState.set(knownTickets);
      this.hasSearchedState.set(true);
      return true;
    } catch {
      return false;
    }
  }

  private startRefreshTimer(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
    }

    this.refreshTimerId = setInterval(() => {
      void this.loadTickets(true);
    }, this.refreshIntervalMs);
  }

  private async loadTicketStatuses(): Promise<void> {
    if (this.ticketStatuses.length || this.isLoadingTicketStatuses) {
      return;
    }

    this.isLoadingTicketStatuses = true;
    this.ticketStatusError = '';

    try {
      this.ticketStatuses = await this.ticketListFacade.loadTicketStatuses();
    } catch (error) {
      this.ticketStatusError =
        error instanceof Error ? error.message : 'Nao foi possivel consultar os status do ticket.';
    } finally {
      this.isLoadingTicketStatuses = false;
    }
  }

  private async handleOwnerChange(ownerSlug: string): Promise<void> {
    this.activeLoadVersion += 1;
    const loadVersion = this.activeLoadVersion;
    this.ownerSlug.set(ownerSlug);
    this.ticketsState.set([]);
    this.ticketRequestErrorState.set('');
    this.hasSearchedState.set(false);
    this.isLoadingTicketsState.set(false);
    this.isRefreshingTicketsState.set(false);
    this.ticketStatuses = [];
    this.ticketStatusError = '';
    this.isLoadingTicketStatuses = false;

    const cachedTickets = this.ticketListFacade.getCachedTickets(ownerSlug);
    if (cachedTickets.length) {
      this.ticketsState.set(cachedTickets);
      this.hasSearchedState.set(true);
    }

    const backgroundRefresh =
      cachedTickets.length > 0 || this.ticketListFacade.hasFreshTickets(ownerSlug);
    const knownTicketsPromise = cachedTickets.length
      ? Promise.resolve(false)
      : this.hydrateKnownTickets(ownerSlug, loadVersion);
    const syncTicketsPromise = this.loadTicketsForOwner(ownerSlug, loadVersion, backgroundRefresh);

    await Promise.allSettled([knownTicketsPromise, syncTicketsPromise]);

    if (!this.isCurrentLoad(ownerSlug, loadVersion)) {
      return;
    }

    this.startRefreshTimer();
  }

  private isCurrentLoad(ownerSlug: string, loadVersion: number): boolean {
    return this.ownerSlug() === ownerSlug && this.activeLoadVersion === loadVersion;
  }
}
