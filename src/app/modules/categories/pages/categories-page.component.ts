import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { TeamWorkspaceHeaderComponent } from '../../../components/team-workspace-header.component';
import { IconComponent } from '../../../components/icon.component';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../models/category.model';
import { OWNER_TITLES } from '../../../ticket-owners';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule, TeamWorkspaceHeaderComponent, IconComponent],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.css',
})
export class CategoriesPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly categoriesService = inject(CategoriesService);

  protected readonly ownerSlug = signal(this.route.snapshot.paramMap.get('ownerSlug') ?? '');
  protected readonly ownerTitle = computed(
    () => OWNER_TITLES[this.ownerSlug()] ?? 'Area de Tickets'
  );

  protected readonly categoriesState = signal<Category[]>([]);
  protected readonly isLoadingState = signal(true);
  protected readonly errorMessageState = signal('');

  protected get categories(): Category[] {
    return this.categoriesState();
  }

  protected get isLoading(): boolean {
    return this.isLoadingState();
  }

  protected get errorMessage(): string {
    return this.errorMessageState();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  protected loadCategories(): void {
    this.isLoadingState.set(true);
    this.errorMessageState.set('');

    console.log('🔄 Carregando categorias da API...');
    this.categoriesService.listCategories().subscribe({
      next: (response) => {
        console.log('✅ Categorias carregadas com sucesso:', response);
        this.categoriesState.set(response.data);
        this.isLoadingState.set(false);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar categorias:', error);
        this.errorMessageState.set('Erro ao carregar categorias. Tente novamente.');
        this.isLoadingState.set(false);
      },
    });
  }

  protected groupByType(categories: Category[]): { [key: number]: Category[] } {
    return categories.reduce(
      (acc, category) => {
        if (!acc[category.type]) {
          acc[category.type] = [];
        }
        acc[category.type].push(category);
        return acc;
      },
      {} as { [key: number]: Category[] }
    );
  }

  protected getTypeLabel(type: number): string {
    return type === 1 ? 'Incidentes' : 'Requisições / Notificações';
  }

  protected getCategoriesByType(type: number): Category[] {
    const grouped = this.groupByType(this.categories);
    return grouped[type] ? this.sortCategories(grouped[type]) : [];
  }

  protected sortCategories(categories: Category[]): Category[] {
    return [...categories].sort((a, b) => {
      if (a.category_name !== b.category_name) {
        return a.category_name.localeCompare(b.category_name);
      }
      if (a.sub_category_name !== b.sub_category_name) {
        return a.sub_category_name.localeCompare(b.sub_category_name);
      }
      return a.third_level_category_name.localeCompare(b.third_level_category_name);
    });
  }
}
