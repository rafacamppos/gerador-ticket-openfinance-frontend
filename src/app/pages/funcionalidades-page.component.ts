import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';

import { IconComponent } from '../components/icon.component';
import { CategoriesService } from '../modules/categories/services/categories.service';
import { Category, TemplatePayloadResponse, CategoryDetailResponse, CategoriesListResponse } from '../modules/categories/models/category.model';

@Component({
  selector: 'app-funcionalidades-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './funcionalidades-page.component.html',
  styleUrl: './funcionalidades-page.component.css',
})
export class FuncionalidadesPageComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly searchSubject = new Subject<string>();

  protected readonly searchQuery = signal('');
  protected readonly allCategories = signal<Category[]>([]);
  protected readonly displayedCategories = signal<Category[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly currentPage = signal(1);
  protected readonly itemsPerPage = 10;
  protected readonly notFoundMessage = signal('');

  protected readonly selectedTemplateId = signal<number | null>(null);
  protected readonly templatePayload = signal<{ [key: string]: string } | null>(null);
  protected readonly templatePayloadLoading = signal(false);
  protected readonly templatePayloadError = signal('');
  protected readonly payloadCopied = signal(false);

  protected readonly paginatedCategories = computed(() => {
    const categories = this.displayedCategories();
    const page = this.currentPage();
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return categories.slice(start, end);
  });

  protected readonly totalPages = computed(() => {
    return Math.ceil(this.displayedCategories().length / this.itemsPerPage);
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
    this.loadCategories();

    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.performSearch(query);
    });
  }

  protected loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.notFoundMessage.set('');
    this.currentPage.set(1);

    console.log('🔄 Carregando todas as categorias...');
    this.categoriesService.listCategories().subscribe({
      next: (response: CategoriesListResponse) => {
        console.log('✅ Categorias carregadas:', response.data.length);
        this.allCategories.set(response.data);
        this.displayedCategories.set(response.data);
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        console.error('❌ Erro ao carregar categorias:', error);
        this.errorMessage.set('Erro ao carregar categorias. Tente novamente.');
        this.isLoading.set(false);
      },
    });
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  private performSearch(query: string): void {
    const searchValue = query.trim();

    if (!searchValue) {
      this.loadCategories();
      return;
    }

    if (/^\d+$/.test(searchValue)) {
      this.searchByIdCategoria(searchValue);
    } else {
      this.notFoundMessage.set('');
      this.displayedCategories.set(this.allCategories());
      this.currentPage.set(1);
    }
  }

  private searchByIdCategoria(categoryId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.notFoundMessage.set('');
    this.currentPage.set(1);

    console.log('🔄 Buscando categoria por ID:', categoryId);
    this.categoriesService.getCategoryById(Number(categoryId)).subscribe({
      next: (response: CategoryDetailResponse) => {
        console.log('✅ Categoria encontrada:', response.data);
        this.displayedCategories.set([response.data]);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('❌ Erro ao buscar categoria:', error);
        this.displayedCategories.set(this.allCategories());
        if (error.status === 404) {
          this.notFoundMessage.set(`Categoria com ID ${categoryId} não encontrada. Exibindo todas as categorias.`);
        } else {
          this.notFoundMessage.set('Erro ao buscar categoria. Exibindo todas as categorias.');
        }
        this.isLoading.set(false);
      },
    });
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.notFoundMessage.set('');
    this.loadCategories();
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

  protected loadTemplatePayload(templateId: number): void {
    this.selectedTemplateId.set(templateId);
    this.templatePayloadLoading.set(true);
    this.templatePayloadError.set('');
    this.templatePayload.set(null);
    this.payloadCopied.set(false);

    console.log('🔄 Carregando payload do template:', templateId);
    this.categoriesService.getTemplatePayload(templateId).subscribe({
      next: (response: TemplatePayloadResponse) => {
        console.log('✅ Payload carregado:', response.data);
        this.templatePayload.set(response.data);
        this.templatePayloadLoading.set(false);
      },
      error: (error: any) => {
        console.error('❌ Erro ao carregar payload:', error);
        this.templatePayloadError.set('Erro ao carregar payload do template. Tente novamente.');
        this.templatePayloadLoading.set(false);
      },
    });
  }

  protected closeTemplatePayload(): void {
    this.selectedTemplateId.set(null);
    this.templatePayload.set(null);
    this.templatePayloadError.set('');
    this.payloadCopied.set(false);
  }

  protected copyPayloadToClipboard(): void {
    const payload = this.templatePayload();
    if (!payload) return;

    const jsonString = JSON.stringify({ data: payload }, null, 2);

    navigator.clipboard.writeText(jsonString).then(() => {
      console.log('✅ Payload copiado para clipboard');
      this.payloadCopied.set(true);

      setTimeout(() => {
        this.payloadCopied.set(false);
      }, 2000);
    }).catch((error) => {
      console.error('❌ Erro ao copiar payload:', error);
      this.templatePayloadError.set('Erro ao copiar payload. Tente novamente.');
    });
  }

  protected getPayloadAsJson(): string {
    const payload = this.templatePayload();
    if (!payload) return '';
    return JSON.stringify({ data: payload }, null, 2);
  }
}
