import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export type CategoriesHierarchyResponse = {
  data: string[];
  count: number;
};

@Injectable({
  providedIn: 'root',
})
export class CategoriesHierarchyService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  listCategories(): Observable<CategoriesHierarchyResponse> {
    const url = `${this.apiBaseUrl}/funcionalidades_categorias`;
    console.log('📡 GET:', url);
    return this.http.get<CategoriesHierarchyResponse>(url);
  }

  listSubCategories(category: string): Observable<CategoriesHierarchyResponse> {
    const url = `${this.apiBaseUrl}/funcionalidades_categorias?category=${encodeURIComponent(
      category
    )}`;
    console.log('📡 GET:', url);
    return this.http.get<CategoriesHierarchyResponse>(url);
  }

  listThirdLevelCategories(subCategory: string): Observable<CategoriesHierarchyResponse> {
    const url = `${this.apiBaseUrl}/funcionalidades_categorias?sub_category=${encodeURIComponent(
      subCategory
    )}`;
    console.log('📡 GET:', url);
    return this.http.get<CategoriesHierarchyResponse>(url);
  }
}
