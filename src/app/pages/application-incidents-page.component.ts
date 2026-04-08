import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApplicationIncidentListPanelComponent } from '../components/application-incident-list-panel.component';
import { TeamWorkspaceHeaderComponent } from '../components/team-workspace-header.component';
import {
  ApplicationIncidentListItem,
  CANAL_JORNADA_LABELS,
  CANAL_JORNADA_OPTIONS,
  CanalJornada,
  ReportApplicationIncidentPayload,
  TIPO_CLIENTE_OPTIONS,
} from '../services/application-incidents.models';
import { ApplicationIncidentsFacadeService } from '../services/application-incidents-facade.service';
import { OpenFinanceApiService } from '../services/open-finance-api.service';
import { OWNER_TITLES } from '../ticket-owners';

@Component({
  selector: 'app-application-incidents-page',
  standalone: true,
  imports: [ApplicationIncidentListPanelComponent, FormsModule, TeamWorkspaceHeaderComponent],
  templateUrl: './application-incidents-page.component.html',
  styleUrl: './application-incidents-page.component.css',
})
export class ApplicationIncidentsPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly incidentsFacade = inject(ApplicationIncidentsFacadeService);
  private readonly openFinanceApi = inject(OpenFinanceApiService);
  private readonly refreshIntervalMs = 300000;
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;
  private routeSubscription: Subscription | null = null;

  protected readonly ownerSlug = signal(this.route.snapshot.paramMap.get('ownerSlug') ?? '');
  protected readonly ownerTitle = computed(
    () => OWNER_TITLES[this.ownerSlug()] ?? 'Area de Tickets'
  );
  protected isLoadingIncidents = false;
  protected isRefreshingIncidents = false;
  protected incidentRequestError = '';
  protected incidents: ApplicationIncidentListItem[] = [];
  protected hasSearched = false;
  protected isSubmittingIncident = false;
  protected incidentSubmitError = '';
  protected incidentSubmitSuccess = '';
  protected isIncidentFormVisible = false;
  protected incidentForm = this.buildEmptyIncidentForm();

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

  protected async loadIncidents(backgroundRefresh = false): Promise<void> {
    if (backgroundRefresh) {
      this.isRefreshingIncidents = true;
    } else {
      this.isLoadingIncidents = true;
    }

    this.incidentRequestError = '';
    this.hasSearched = true;

    try {
      this.incidents = await this.incidentsFacade.loadIncidents(this.ownerSlug());
    } catch (error) {
      this.incidentRequestError = this.incidentsFacade.getLoadErrorMessage(error);
    } finally {
      this.isLoadingIncidents = false;
      this.isRefreshingIncidents = false;
    }
  }

  private startRefreshTimer(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
    }

    this.refreshTimerId = setInterval(() => {
      void this.loadIncidents(true);
    }, this.refreshIntervalMs);
  }

  protected isSuWorkspace(): boolean {
    return this.ownerSlug() === 'su-super-usuarios';
  }

  protected toggleIncidentForm(): void {
    this.isIncidentFormVisible = !this.isIncidentFormVisible;
  }

  protected hideIncidentForm(): void {
    this.isIncidentFormVisible = false;
  }

  protected routeOwnerOptions(): Array<{ slug: string; title: string }> {
    return Object.entries(OWNER_TITLES).map(([slug, title]) => ({ slug, title }));
  }

  protected async submitIncident(): Promise<void> {
    this.isSubmittingIncident = true;
    this.incidentSubmitError = '';
    this.incidentSubmitSuccess = '';

    try {
      let payloadRequest: Record<string, unknown>;
      let payloadResponse: Record<string, unknown>;

      try {
        payloadRequest = JSON.parse(this.incidentForm.payload_request.trim()) as Record<string, unknown>;
      } catch {
        throw new Error('O campo "Payload Request" deve conter JSON válido.');
      }

      try {
        payloadResponse = JSON.parse(this.incidentForm.payload_response.trim()) as Record<string, unknown>;
      } catch {
        throw new Error('O campo "Payload Response" deve conter JSON válido.');
      }

      const teamSlug = this.incidentForm.targetOwnerSlug.trim();
      if (!teamSlug) {
        throw new Error('Selecione a equipe responsável pelo incidente.');
      }

      const title = this.incidentForm.title.trim();
      if (!title) {
        throw new Error('O campo "Título" é obrigatório.');
      }

      const description = this.incidentForm.description.trim();
      if (!description) {
        throw new Error('O campo "Descrição" é obrigatório.');
      }

      const payload: ReportApplicationIncidentPayload = {
        x_fapi_interaction_id: this.incidentForm.x_fapi_interaction_id.trim(),
        authorization_server: this.incidentForm.authorization_server.trim(),
        client_id: this.incidentForm.client_id.trim(),
        endpoint: this.incidentForm.endpoint.trim(),
        method: this.incidentForm.method.trim().toUpperCase(),
        title,
        description,
        tipo_cliente: this.incidentForm.tipo_cliente,
        canal_jornada: this.incidentForm.canal_jornada,
        payload_request: payloadRequest,
        payload_response: payloadResponse,
        occurred_at: new Date(this.incidentForm.occurred_at).toISOString(),
        http_status_code: Number(this.incidentForm.http_status_code),
      };

      const createdIncident = await this.openFinanceApi.reportApplicationIncident(teamSlug, payload);
      this.incidentsFacade.syncIncident(teamSlug, createdIncident);

      if (teamSlug !== this.ownerSlug()) {
        this.incidentsFacade.invalidateOwner(teamSlug);
      }

      this.incidentSubmitSuccess = 'Incidente cadastrado com sucesso.';
      this.incidentForm = this.buildEmptyIncidentForm();
      this.isIncidentFormVisible = false;
      await this.loadIncidents(true);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.incidentSubmitError = `Falha ao cadastrar incidente (${error.status}).`;
      } else {
        this.incidentSubmitError =
          error instanceof Error ? error.message : 'Nao foi possivel cadastrar o incidente.';
      }
    } finally {
      this.isSubmittingIncident = false;
    }
  }

  protected methodOptions(): string[] {
    return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  }

  protected tipoClienteOptions(): readonly string[] {
    return TIPO_CLIENTE_OPTIONS;
  }

  protected canalJornadaOptions(): readonly CanalJornada[] {
    return CANAL_JORNADA_OPTIONS;
  }

  protected canalJornadaLabel(value: CanalJornada): string {
    return CANAL_JORNADA_LABELS[value];
  }

  private toDatetimeLocalValue(date = new Date()): string {
    const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
  }

  private buildEmptyIncidentForm() {
    return {
      targetOwnerSlug: '',
      x_fapi_interaction_id: '',
      authorization_server: '',
      client_id: '',
      endpoint: '',
      method: 'POST',
      title: '',
      description: '',
      tipo_cliente: 'PF' as const,
      canal_jornada: 'NA' as const,
      payload_request: '{\n  \n}',
      payload_response: '{\n  \n}',
      occurred_at: this.toDatetimeLocalValue(),
      http_status_code: '500',
    };
  }

  private async handleOwnerChange(ownerSlug: string): Promise<void> {
    this.ownerSlug.set(ownerSlug);
    this.incidents = [];
    this.incidentRequestError = '';
    this.hasSearched = false;
    this.hideIncidentForm();

    const cachedIncidents = this.incidentsFacade.getCachedIncidents(ownerSlug);
    if (cachedIncidents.length) {
      this.incidents = cachedIncidents;
      this.hasSearched = true;
    }

    await this.loadIncidents(Boolean(cachedIncidents.length));
    this.startRefreshTimer();
  }
}
