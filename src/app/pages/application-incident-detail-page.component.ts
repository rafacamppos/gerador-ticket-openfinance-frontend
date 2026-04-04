import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationIncidentsFacadeService } from '../services/application-incidents-facade.service';
import { ApplicationIncident } from '../services/application-incidents.models';
import { OpenFinanceApiService } from '../services/open-finance-api.service';
import { PortalAuthService } from '../services/portal-auth.service';

@Component({
  selector: 'app-application-incident-detail-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './application-incident-detail-page.component.html',
  styleUrl: './application-incident-detail-page.component.css',
})
export class ApplicationIncidentDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly openFinanceApi = inject(OpenFinanceApiService);
  private readonly portalAuth = inject(PortalAuthService);
  private readonly applicationIncidentsFacade = inject(ApplicationIncidentsFacadeService);

  protected isLoading = true;
  protected isAssigningToMe = false;
  protected isUpdatingStatus = false;
  protected isCreateTicketModalVisible = false;
  protected isCreatingTicket = false;
  protected errorMessage = '';
  protected ticketCreateError = '';
  protected ticketCreateSuccess = '';
  protected incident: ApplicationIncident | null = null;
  protected ticketForm = this.buildTicketForm();


  async ngOnInit(): Promise<void> {
    const ownerSlug = this.ownerSlug();
    const incidentId = this.incidentId();

    if (!ownerSlug || !incidentId) {
      this.errorMessage = 'Incidente não informado.';
      this.isLoading = false;
      return;
    }

    try {
      this.incident = await this.openFinanceApi.getApplicationIncidentById(ownerSlug, incidentId);
      this.syncIncidentCache();
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.errorMessage = `Falha ao carregar incidente (${error.status}).`;
      } else {
        this.errorMessage =
          error instanceof Error ? error.message : 'Nao foi possivel carregar o incidente.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  protected ownerSlug(): string {
    return this.route.snapshot.paramMap.get('ownerSlug') ?? '';
  }

  protected incidentId(): string {
    return this.route.snapshot.paramMap.get('incidentId') ?? '';
  }

  protected goBack(): void {
    void this.router.navigate(['/areas', this.ownerSlug(), 'incidentes-aplicacoes']);
  }

  protected async assignToMe(): Promise<void> {
    if (!this.incident || this.isAssigningToMe || this.isAssignedToMe()) {
      return;
    }

    this.isAssigningToMe = true;
    this.errorMessage = '';

    try {
      this.incident = await this.openFinanceApi.assignApplicationIncidentToMe(
        this.ownerSlug(),
        this.incident.id || ''
      );
      this.syncIncidentCache();
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.errorMessage = `Falha ao atribuir incidente (${error.status}).`;
      } else {
        this.errorMessage =
          error instanceof Error ? error.message : 'Nao foi possivel atribuir o incidente.';
      }
    } finally {
      this.isAssigningToMe = false;
    }
  }

  protected async markMonitoring(): Promise<void> {
    await this.transitionIncident('monitoring');
  }

  protected async markResolved(): Promise<void> {
    await this.transitionIncident('resolved');
  }

  protected async markCanceled(): Promise<void> {
    await this.transitionIncident('canceled');
  }

  protected openCreateTicketModal(): void {
    if (!this.incident) {
      return;
    }

    this.ticketCreateError = '';
    this.ticketCreateSuccess = '';
    this.ticketForm = this.buildTicketForm();
    this.isCreateTicketModalVisible = true;
  }

  protected closeCreateTicketModal(): void {
    if (this.isCreatingTicket) {
      return;
    }

    this.isCreateTicketModalVisible = false;
  }

  protected async createTicket(): Promise<void> {
    if (!this.incident || this.isCreatingTicket) {
      return;
    }

    this.isCreatingTicket = true;
    this.ticketCreateError = '';
    this.ticketCreateSuccess = '';

    try {
      const result = await this.openFinanceApi.createIncidentTicket(
        this.ownerSlug(),
        this.incident.id || '',
        {}
      );

      this.incident = result.incident;
      this.syncIncidentCache();
      this.ticketCreateSuccess = `Ticket #${result.ticket_id} criado com sucesso.`;
      this.isCreateTicketModalVisible = false;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.ticketCreateError = `Falha ao criar ticket (${error.status}).`;
      } else {
        this.ticketCreateError =
          error instanceof Error ? error.message : 'Nao foi possivel criar o ticket.';
      }
    } finally {
      this.isCreatingTicket = false;
    }
  }

  protected isAssignedToMe(): boolean {
    const incident = this.incident;
    const user = this.portalAuth.getUser();

    if (!incident || !user) {
      return false;
    }

    if (incident.assigned_to_user_id && user.id) {
      return incident.assigned_to_user_id === user.id;
    }

    if (incident.assigned_to_email && user.email) {
      return incident.assigned_to_email === user.email;
    }

    return false;
  }

  private async transitionIncident(
    incidentStatus: string,
    relatedTicketId?: number
  ): Promise<void> {
    if (!this.incident || this.isUpdatingStatus) {
      return;
    }

    this.isUpdatingStatus = true;
    this.errorMessage = '';

    try {
      this.incident = await this.openFinanceApi.transitionApplicationIncident(
        this.ownerSlug(),
        this.incident.id || '',
        {
          incident_status: incidentStatus,
          related_ticket_id: relatedTicketId ?? null,
        }
      );
      this.syncIncidentCache();
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.errorMessage = `Falha ao atualizar incidente (${error.status}).`;
      } else {
        this.errorMessage =
          error instanceof Error ? error.message : 'Nao foi possivel atualizar o incidente.';
      }
    } finally {
      this.isUpdatingStatus = false;
    }
  }

  private buildTicketForm(): Record<string, never> {
    return {};
  }

  private syncIncidentCache(): void {
    if (!this.incident) {
      return;
    }

    this.applicationIncidentsFacade.syncIncident(this.ownerSlug(), this.incident);
  }

  protected formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'Nao informado';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }
}
