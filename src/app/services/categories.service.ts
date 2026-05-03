import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  category_name: string;
  sub_category_name: string;
  third_level_category_name: string;
  template_id: number;
  type: number;
}

export interface CategoriesListResponse {
  data: Category[];
  count: number;
}

export interface CategoryDetailResponse {
  data: Category;
}

export interface TemplatePayloadResponse {
  data: { [key: string]: string };
}

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = '/api/v1/open-finance';

  listCategories(): Observable<CategoriesListResponse> {
    return this.http.get<CategoriesListResponse>(`${this.apiBaseUrl}/categories`);
  }

  getCategoryById(categoryId: number): Observable<CategoryDetailResponse> {
    return this.http.get<CategoryDetailResponse>(`${this.apiBaseUrl}/categories/${categoryId}`);
  }

  getTemplatePayload(templateId: number): Observable<TemplatePayloadResponse> {
    return this.http.get<TemplatePayloadResponse>(`${this.apiBaseUrl}/templates/${templateId}/payload`);
  }
}
