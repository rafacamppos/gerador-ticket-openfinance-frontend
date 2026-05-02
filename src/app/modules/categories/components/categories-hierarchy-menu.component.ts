import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconComponent } from '../../../components/icon.component';
import { CategoriesHierarchyService } from '../services/categories-hierarchy.service';

@Component({
  selector: 'app-categories-hierarchy-menu',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './categories-hierarchy-menu.component.html',
  styleUrl: './categories-hierarchy-menu.component.css',
})
export class CategoriesHierarchyMenuComponent implements OnInit {
  private readonly hierarchyService = inject(CategoriesHierarchyService);

  protected readonly level = signal<1 | 2 | 3>(1);
  protected readonly level1Items = signal<string[]>([]);
  protected readonly level2Items = signal<string[]>([]);
  protected readonly level3Items = signal<string[]>([]);

  protected readonly level1Selected = signal<string | null>(null);
  protected readonly level2Selected = signal<string | null>(null);

  protected readonly isLoadingLevel1 = signal(false);
  protected readonly isLoadingLevel2 = signal(false);
  protected readonly isLoadingLevel3 = signal(false);

  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadLevel1();
  }

  protected loadLevel1(): void {
    this.isLoadingLevel1.set(true);
    this.errorMessage.set('');

    console.log('🔄 Carregando categorias do nível 1...');
    this.hierarchyService.listCategories().subscribe({
      next: (response) => {
        console.log('✅ Categorias nível 1 carregadas:', response.data);
        this.level1Items.set(response.data);
        this.isLoadingLevel1.set(false);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar categorias nível 1:', error);
        this.errorMessage.set('Erro ao carregar categorias.');
        this.isLoadingLevel1.set(false);
      },
    });
  }

  protected selectLevel1(category: string): void {
    this.level1Selected.set(category);
    this.level2Selected.set(null);
    this.level2Items.set([]);
    this.level3Items.set([]);
    this.level.set(2);
    this.loadLevel2(category);
  }

  protected loadLevel2(category: string): void {
    this.isLoadingLevel2.set(true);
    this.errorMessage.set('');

    console.log('🔄 Carregando subcategorias para:', category);
    this.hierarchyService.listSubCategories(category).subscribe({
      next: (response) => {
        console.log('✅ Subcategorias carregadas:', response.data);
        this.level2Items.set(response.data);
        this.isLoadingLevel2.set(false);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar subcategorias:', error);
        this.errorMessage.set('Erro ao carregar subcategorias.');
        this.isLoadingLevel2.set(false);
      },
    });
  }

  protected selectLevel2(subCategory: string): void {
    this.level2Selected.set(subCategory);
    this.level3Items.set([]);
    this.level.set(3);
    this.loadLevel3(subCategory);
  }

  protected loadLevel3(subCategory: string): void {
    this.isLoadingLevel3.set(true);
    this.errorMessage.set('');

    console.log('🔄 Carregando nível 3 para:', subCategory);
    this.hierarchyService.listThirdLevelCategories(subCategory).subscribe({
      next: (response) => {
        console.log('✅ Nível 3 carregado:', response.data);
        this.level3Items.set(response.data);
        this.isLoadingLevel3.set(false);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar nível 3:', error);
        this.errorMessage.set('Erro ao carregar detalhamento.');
        this.isLoadingLevel3.set(false);
      },
    });
  }

  protected goBack(): void {
    if (this.level() === 2) {
      this.level1Selected.set(null);
      this.level2Items.set([]);
      this.level2Selected.set(null);
      this.level3Items.set([]);
      this.level.set(1);
    } else if (this.level() === 3) {
      this.level2Selected.set(null);
      this.level3Items.set([]);
      this.level.set(2);
    }
  }

  protected reset(): void {
    this.level.set(1);
    this.level1Selected.set(null);
    this.level2Selected.set(null);
    this.level2Items.set([]);
    this.level3Items.set([]);
    this.errorMessage.set('');
  }

  protected getTitle(): string {
    if (this.level() === 1) {
      return 'Categorias';
    }
    if (this.level() === 2) {
      return this.level1Selected() || 'Subcategorias';
    }
    if (this.level() === 3) {
      return this.level2Selected() || 'Detalhamento';
    }
    return '';
  }
}
