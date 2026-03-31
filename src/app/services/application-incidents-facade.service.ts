import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { OpenFinanceApiService } from './open-finance-api.service';
import {
  ApplicationIncidentsService,
} from './application-incidents.service';
import { ApplicationIncident, ApplicationIncidentListItem } from './application-incidents.models';

@Injectable({
  providedIn: 'root',
})
export class ApplicationIncidentsFacadeService {
  private readonly openFinanceApi = inject(OpenFinanceApiService);
  private readonly applicationIncidentsService = inject(ApplicationIncidentsService);

  getCachedIncidents(ownerSlug: string): ApplicationIncidentListItem[] {
    return this.applicationIncidentsService.getIncidents(ownerSlug);
  }

  hasFreshIncidents(ownerSlug: string): boolean {
    return this.applicationIncidentsService.hasFreshIncidents(ownerSlug);
  }

  async loadIncidents(ownerSlug: string): Promise<ApplicationIncidentListItem[]> {
    const payload = await this.openFinanceApi.listApplicationIncidents(ownerSlug);
    const incidents = this.applicationIncidentsService.mapIncidentListPayload(payload);
    this.applicationIncidentsService.setIncidents(ownerSlug, incidents);
    return incidents;
  }

  syncIncident(ownerSlug: string, incident: ApplicationIncident): void {
    this.applicationIncidentsService.syncIncident(ownerSlug, incident);
  }

  invalidateOwner(ownerSlug: string): void {
    this.applicationIncidentsService.invalidateOwner(ownerSlug);
  }

  getLoadErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Nao foi possivel renovar a sessao automaticamente.';
    }

    if (error instanceof HttpErrorResponse) {
      return `Falha ao consultar incidentes (${error.status}).`;
    }

    return error instanceof Error ? error.message : 'Nao foi possivel consultar incidentes.';
  }
}
