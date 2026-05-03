import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ApiVersion {
  id: string;
  api_name_version: string;
  api_version: string;
  product_feature: string;
  stage_name_version: string;
}

export interface ApiVersionResponse {
  data: {
    total_versions: number;
    versions: ApiVersion[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class ApiVersionsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  listApiVersions(): Observable<ApiVersionResponse> {
    const url = `${this.apiBaseUrl}/api-versions`;
    return this.http.get<ApiVersionResponse>(url);
  }

  getApiVersionById(id: string): Observable<{ data: ApiVersion }> {
    const url = `${this.apiBaseUrl}/api-versions/${id}`;
    return this.http.get<{ data: ApiVersion }>(url);
  }
}
