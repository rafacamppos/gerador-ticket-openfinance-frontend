import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { OpenFinanceApiService, PortalUser } from './open-finance-api.service';
import { OpenFinanceTicketService } from './open-finance-ticket.service';
import { TicketListFacadeService } from './ticket-list-facade.service';

@Injectable({
  providedIn: 'root',
})
export class PortalAuthService {
  private readonly api = inject(OpenFinanceApiService);
  private readonly ticketListFacade = inject(TicketListFacadeService);
  private readonly ticketService = inject(OpenFinanceTicketService);
  private readonly storageKey = 'open-finance-portal-user';
  private currentUser = this.loadStoredUser();

  getUser(): PortalUser | null {
    return this.currentUser;
  }

  getUserName(): string {
    return this.currentUser?.name || '';
  }

  getProfile(): 'user' | 'adm' | null {
    return this.currentUser?.profile || null;
  }

  getTeamSlug(): string {
    return this.currentUser?.team?.slug || '';
  }

  getHomeRoute(): string {
    if (this.getProfile() === 'adm') {
      return '/dashboard';
    }

    const teamSlug = this.getTeamSlug();
    return teamSlug ? `/areas/${teamSlug}` : '/login';
  }

  canAccessOwner(ownerSlug: string): boolean {
    if (this.getProfile() === 'adm') {
      return true;
    }

    return Boolean(ownerSlug) && ownerSlug === this.getTeamSlug();
  }

  async login(email: string, password: string): Promise<PortalUser> {
    const user = await this.api.login(email, password);
    this.ticketService.clearCache();
    this.storeUser(user);
    await this.preloadKnownTickets(user);
    return user;
  }

  async ensureSession(): Promise<boolean> {
    if (this.currentUser) {
      return true;
    }

    try {
      const user = await this.api.getCurrentUser();
      this.storeUser(user);
      await this.preloadKnownTickets(user);
      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.clearUser();
        return false;
      }

      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.logout();
    } finally {
      this.ticketService.clearCache();
      this.clearUser();
    }
  }

  private storeUser(user: PortalUser): void {
    this.currentUser = user;
    sessionStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  private clearUser(): void {
    this.currentUser = null;
    sessionStorage.removeItem(this.storageKey);
  }

  private loadStoredUser(): PortalUser | null {
    try {
      const rawValue = sessionStorage.getItem(this.storageKey);
      if (!rawValue) {
        return null;
      }

      return JSON.parse(rawValue) as PortalUser;
    } catch {
      return null;
    }
  }

  private async preloadKnownTickets(user: PortalUser | null): Promise<void> {
    const ownerSlug = user?.team?.slug || '';
    if (!ownerSlug) {
      return;
    }

    try {
      await this.ticketListFacade.preloadKnownTickets(ownerSlug);
    } catch {
      // Ticket preload is best-effort and must not block authentication.
    }
  }
}
