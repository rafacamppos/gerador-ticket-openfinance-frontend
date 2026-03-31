import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApplicationIncidentListItem } from '../services/application-incidents.models';

@Component({
  selector: 'app-application-incident-list-panel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './application-incident-list-panel.component.html',
  styleUrl: './application-incident-list-panel.component.css',
})
export class ApplicationIncidentListPanelComponent implements OnChanges {
  @Input({ required: true }) ownerSlug = '';
  @Input() incidents: ApplicationIncidentListItem[] = [];
  @Input() isLoading = false;
  @Input() hasSearched = false;
  @Input() errorMessage = '';
  @Input() initialMessage = 'Nenhum incidente foi carregado para esta area.';
  @Input() emptySearchMessage = 'Nenhum incidente foi localizado para esta area.';

  protected readonly pageSize = 10;
  protected currentPage = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incidents']) {
      this.currentPage = 1;
    }
  }

  protected get totalPages(): number {
    return Math.max(1, Math.ceil(this.incidents.length / this.pageSize));
  }

  protected get paginatedIncidents(): ApplicationIncidentListItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.incidents.slice(startIndex, startIndex + this.pageSize);
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

  protected hasIncidentStatus(
    incident: ApplicationIncidentListItem,
    status: ApplicationIncidentListItem['incidentStatus']
  ): boolean {
    return incident.incidentStatus === status;
  }
}
