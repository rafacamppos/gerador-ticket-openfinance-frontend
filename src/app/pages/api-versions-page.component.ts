import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';

import { IconComponent } from '../components/icon.component';
import { ApiVersionsService, ApiVersion } from '../services/api-versions.service';

@Component({
  selector: 'app-api-versions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './api-versions-page.component.html',
  styleUrl: './api-versions-page.component.css',
})
export class ApiVersionsPageComponent implements OnInit {
  private readonly apiVersionsService = inject(ApiVersionsService);
  private readonly searchSubject = new Subject<string>();

  protected readonly searchQuery = signal('');
  protected readonly allVersions = signal<ApiVersion[]>([]);
  protected readonly displayedVersions = signal<ApiVersion[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly currentPage = signal(1);
  protected readonly itemsPerPage = 10;
  protected readonly notFoundMessage = signal('');

  protected readonly paginatedVersions = computed(() => {
    const versions = this.displayedVersions();
    const page = this.currentPage();
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return versions.slice(start, end);
  });

  protected readonly totalPages = computed(() => {
    return Math.ceil(this.displayedVersions().length / this.itemsPerPage);
  });

  protected readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (current > 3) {
        pages.push(0);
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (current < total - 2) {
        pages.push(0);
      }

      pages.push(total);
    }

    return pages;
  });

  ngOnInit(): void {
    this.loadApiVersions();

    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.performSearch(query);
    });
  }

  protected loadApiVersions(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.notFoundMessage.set('');
    this.currentPage.set(1);

    this.apiVersionsService.listApiVersions().subscribe({
      next: (response) => {
        this.allVersions.set(response.data.versions);
        this.displayedVersions.set(response.data.versions);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Erro ao carregar versões de APIs. Tente novamente.');
        this.isLoading.set(false);
      },
    });
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  private performSearch(query: string): void {
    const searchValue = query.trim().toLowerCase();

    if (!searchValue) {
      this.loadApiVersions();
      return;
    }

    this.notFoundMessage.set('');
    const filtered = this.allVersions().filter((version) =>
      version.api_name_version.toLowerCase().includes(searchValue) ||
      version.api_version.toLowerCase().includes(searchValue) ||
      version.product_feature.toLowerCase().includes(searchValue) ||
      version.stage_name_version.toLowerCase().includes(searchValue)
    );

    this.displayedVersions.set(filtered);
    this.currentPage.set(1);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.notFoundMessage.set('');
    this.loadApiVersions();
  }

  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  protected previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  protected nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }
}
