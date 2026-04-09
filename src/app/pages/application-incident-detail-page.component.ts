import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationIncidentsFacadeService } from '../services/application-incidents-facade.service';
import { ApplicationIncident, TicketPreview } from '../services/application-incidents.models';
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
  protected isLoadingTicketPreview = false;
  protected isCreatingTicket = false;
  protected errorMessage = '';
  protected ticketCreateError = '';
  protected ticketCreateSuccess = '';
  protected incident: ApplicationIncident | null = null;
  protected ticketPreview: TicketPreview | null = null;
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

  protected async openCreateTicketModal(): Promise<void> {
    if (!this.incident || !this.canCreateTicket()) {
      return;
    }

    this.ticketCreateError = '';
    this.ticketCreateSuccess = '';
    this.ticketPreview = null;
    this.isLoadingTicketPreview = true;
    this.isCreateTicketModalVisible = true;

    try {
      const preview = await this.openFinanceApi.getTicketPreview(
        this.ownerSlug(),
        this.incident.id || ''
      );
      this.ticketPreview = preview;
      this.ticketForm = this.buildTicketForm(preview);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.ticketCreateError = `Falha ao carregar campos do ticket (${error.status}).`;
      } else {
        this.ticketCreateError =
          error instanceof Error ? error.message : 'Nao foi possivel carregar os campos.';
      }
    } finally {
      this.isLoadingTicketPreview = false;
    }
  }

  protected closeCreateTicketModal(): void {
    if (this.isCreatingTicket || this.isLoadingTicketPreview) {
      return;
    }

    this.isCreateTicketModalVisible = false;
  }

  protected async createTicket(): Promise<void> {
    if (!this.incident || !this.ticketPreview || this.isCreatingTicket) {
      return;
    }

    this.isCreatingTicket = true;
    this.ticketCreateError = '';
    this.ticketCreateSuccess = '';

    try {
      const result = await this.openFinanceApi.createIncidentTicket(
        this.ownerSlug(),
        this.incident.id || '',
        {
          title: this.ticketForm.title,
          description: this.ticketForm.description,
          template_fields: this.ticketForm.template_fields,
        }
      );

      const newTicketStatus = await this.resolveTicketStatusIdByName('NOVO');
      await this.openFinanceApi.updateTicket(String(result.ticket_id || ''), {
        id: String(result.ticket_id || ''),
        info: [
          { key: 'status', value: newTicketStatus },
        ],
      });

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

  protected hasRelatedTicket(): boolean {
    return Boolean(this.incident?.related_ticket_id);
  }

  protected canCreateTicket(): boolean {
    return this.isAssignedToMe() && !this.hasRelatedTicket();
  }

  protected formatDateTime(value: unknown): string {
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

  private async resolveTicketStatusIdByName(statusName: string): Promise<string> {
    const normalizedStatusName = String(statusName || '').trim().toUpperCase();
    const statuses = await this.openFinanceApi.listTicketStatuses();
    const matchedStatus = statuses.find(
      (status) => String(status.name || '').trim().toUpperCase() === normalizedStatusName
    );

    if (!matchedStatus?.id) {
      throw new Error(`Status "${normalizedStatusName}" não encontrado.`);
    }

    return String(matchedStatus.id);
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

  private buildTicketForm(preview?: TicketPreview): {
    title: string;
    description: string;
    template_fields: Array<{ key: string; value: string }>;
  } {
    if (!preview) {
      return { title: '', description: '', template_fields: [] };
    }
    return {
      title: preview.title,
      description: preview.description,
      template_fields: preview.template_fields.map((f) => ({ key: f.key, value: f.value })),
    };
  }

  private syncIncidentCache(): void {
    if (!this.incident) {
      return;
    }

    this.applicationIncidentsFacade.syncIncident(this.ownerSlug(), this.incident);
  }

  protected formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'Não informado';
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
