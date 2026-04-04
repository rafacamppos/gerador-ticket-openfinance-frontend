import { Injectable } from '@angular/core';

import {
  ApplicationIncident,
  ApplicationIncidentListItem,
} from './application-incidents.models';

type IncidentCacheEntry = {
  incidents: ApplicationIncidentListItem[];
  fetchedAt: number;
};

@Injectable({
  providedIn: 'root',
})
export class ApplicationIncidentsService {
  private readonly storageKey = 'open-finance-application-incidents-v1';
  private readonly defaultTtlMs = 120000;
  private cache = this.loadStoredIncidents();

  getIncidents(ownerSlug: string): ApplicationIncidentListItem[] {
    return this.cache[ownerSlug]?.incidents || [];
  }

  hasFreshIncidents(ownerSlug: string, ttlMs = this.defaultTtlMs): boolean {
    const fetchedAt = this.cache[ownerSlug]?.fetchedAt || 0;
    return Boolean(fetchedAt) && Date.now() - fetchedAt < ttlMs;
  }

  setIncidents(ownerSlug: string, incidents: ApplicationIncidentListItem[]): void {
    this.cache[ownerSlug] = {
      incidents,
      fetchedAt: Date.now(),
    };
    sessionStorage.setItem(this.storageKey, JSON.stringify(this.cache));
  }

  invalidateOwner(ownerSlug: string): void {
    if (!ownerSlug || !this.cache[ownerSlug]) {
      return;
    }

    delete this.cache[ownerSlug];
    sessionStorage.setItem(this.storageKey, JSON.stringify(this.cache));
  }

  syncIncident(ownerSlug: string, incident: ApplicationIncident): void {
    const currentIncidents = this.getIncidents(ownerSlug);
    const nextIncident = this.mapIncidentItem(incident);
    const filteredIncidents = currentIncidents.filter(
      (currentIncident) => currentIncident.id !== nextIncident.id
    );

    this.setIncidents(ownerSlug, [nextIncident, ...filteredIncidents].sort((left, right) => {
      if (right.dataHoraMs !== left.dataHoraMs) {
        return right.dataHoraMs - left.dataHoraMs;
      }

      return right.createdAtMs - left.createdAtMs;
    }));
  }

  clearCache(): void {
    this.cache = {};
    sessionStorage.removeItem(this.storageKey);
  }

  mapIncidentListPayload(payload: ApplicationIncident[] | unknown): ApplicationIncidentListItem[] {
    const items = Array.isArray(payload) ? payload : [];

    return items
      .map((incident) => this.mapIncidentItem(incident))
      .sort((left, right) => {
        if (right.dataHoraMs !== left.dataHoraMs) {
          return right.dataHoraMs - left.dataHoraMs;
        }

        return right.createdAtMs - left.createdAtMs;
      });
  }

  mapIncidentItem(incident: ApplicationIncident): ApplicationIncidentListItem {
    return {
      id: String(incident.id ?? ''),
      endpoint: String(incident.endpoint ?? 'Sem endpoint'),
      method: String(incident.method ?? 'N/A'),
      incidentStatus: incident.incident_status ?? null,
      statusCodeLabel: incident.http_status_code
        ? `HTTP ${incident.http_status_code}`
        : 'HTTP N/A',
      incidentStatusLabel: String(incident.incident_status_label ?? 'Nao informado'),
      relatedTicketId: incident.related_ticket_id ? String(incident.related_ticket_id) : null,
      summary: incident.title || 'Sem título',
      dataHora: this.formatDateTime(incident.occurred_at),
      dataHoraMs: this.parseDateMs(incident.occurred_at),
      createdAt: this.formatDateTime(incident.created_at),
      createdAtMs: this.parseDateMs(incident.created_at),
    };
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

  private parseDateMs(value: unknown): number {
    if (!value) {
      return 0;
    }

    const parsed = Date.parse(String(value));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private loadStoredIncidents(): Record<string, IncidentCacheEntry> {
    try {
      const rawValue = sessionStorage.getItem(this.storageKey);
      if (!rawValue) {
        return {};
      }

      const parsed = JSON.parse(rawValue);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
}
