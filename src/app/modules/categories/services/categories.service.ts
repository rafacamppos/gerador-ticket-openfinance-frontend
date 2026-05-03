import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Category, CategoriesListResponse, CategoryDetailResponse, TemplatePayloadResponse } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  listCategories(): Observable<CategoriesListResponse> {
    const url = `${this.apiBaseUrl}/categories`;
    console.log('📡 GET:', url);
    return this.http.get<CategoriesListResponse>(url);
  }

  getCategoryById(categoryId: number): Observable<CategoryDetailResponse> {
    const url = `${this.apiBaseUrl}/categories/${categoryId}`;
    console.log('📡 GET:', url);
    return this.http.get<CategoryDetailResponse>(url);
  }

  getTemplatePayload(templateId: number): Observable<TemplatePayloadResponse> {
    const url = `${this.apiBaseUrl}/templates/${templateId}/payload`;
    console.log('📡 GET:', url);
    return this.http.get<TemplatePayloadResponse>(url);
  }
}
