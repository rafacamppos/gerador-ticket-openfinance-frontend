import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { ApplicationIncidentsPageComponent } from './application-incidents-page.component';
import { OpenFinanceApiService } from '../services/open-finance-api.service';
import { ApplicationIncidentsFacadeService } from '../services/application-incidents-facade.service';
import { ApplicationIncident } from '../services/application-incidents.models';

function makeIncident(overrides: Partial<ApplicationIncident> = {}): ApplicationIncident {
  return {
    id: '1',
    team_slug: 'su-super-usuarios',
    team_name: 'SU',
    x_fapi_interaction_id: 'fapi-uuid-001',
    authorization_server: 'auth-uuid-001',
    client_id: 'client-uuid-001',
    endpoint: '/open-banking/consents/v3/consents',
    method: 'POST',
    title: 'Falha na criação de consentimento',
    description: 'Erro ao criar consentimento',
    tipo_cliente: 'PF' as const,
    canal_jornada: 'App to app' as const,
    payload_request: { consentId: 'urn:abc' },
    payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
    occurred_at: '2026-04-01T10:00:00.000Z',
    http_status_code: 422,
    ticket_context: null,
    incident_status: 'new',
    incident_status_label: 'Novo',
    related_ticket_id: null,
    assigned_to_user_id: null,
    assigned_to_name: null,
    assigned_to_email: null,
    created_at: '2026-04-01T10:05:00.000Z',
    updated_at: '2026-04-01T10:05:00.000Z',
    ...overrides,
  };
}

describe('ApplicationIncidentsPageComponent', () => {
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let facadeSpy: jasmine.SpyObj<ApplicationIncidentsFacadeService>;

  beforeEach(async () => {
    sessionStorage.clear();

    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', [
      'reportApplicationIncident',
    ]);

    facadeSpy = jasmine.createSpyObj<ApplicationIncidentsFacadeService>(
      'ApplicationIncidentsFacadeService',
      ['loadIncidents', 'getCachedIncidents', 'syncIncident', 'invalidateOwner', 'getLoadErrorMessage']
    );

    facadeSpy.getCachedIncidents.and.returnValue([]);
    facadeSpy.loadIncidents.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [ApplicationIncidentsPageComponent],
      providers: [
        provideRouter([]),
        { provide: OpenFinanceApiService, useValue: apiSpy },
        { provide: ApplicationIncidentsFacadeService, useValue: facadeSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ ownerSlug: 'su-super-usuarios' }) },
            paramMap: {
              subscribe: (fn: (params: any) => void) => {
                fn(convertToParamMap({ ownerSlug: 'su-super-usuarios' }));
                return { unsubscribe: () => {} };
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('submitIncident envia payload com description, payload_request e payload_response', fakeAsync(() => {
    const createdIncident = makeIncident();
    apiSpy.reportApplicationIncident.and.resolveTo(createdIncident);
    facadeSpy.loadIncidents.and.resolveTo([]);

    const fixture = TestBed.createComponent(ApplicationIncidentsPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    component.incidentForm = {
      targetOwnerSlug: 'consentimentos-inbound',
      x_fapi_interaction_id: 'fapi-uuid-001',
      authorization_server: 'auth-uuid-001',
      client_id: 'client-uuid-001',
      endpoint: '/open-banking/consents/v3/consents',
      method: 'POST',
      title: 'Falha na criação de consentimento',
      description: 'Erro ao criar consentimento',
      tipo_cliente: 'PF' as const,
      canal_jornada: 'App to app' as const,
      payload_request: '{"consentId":"urn:abc"}',
      payload_response: '{"error":"DETALHE_PGTO_INVALIDO"}',
      occurred_at: '2026-04-01T10:00',
      http_status_code: '422',
    };

    void component.submitIncident();
    tick();

    expect(apiSpy.reportApplicationIncident).toHaveBeenCalledWith(
      'consentimentos-inbound',
      jasmine.objectContaining({
        title: 'Falha na criação de consentimento',
        description: 'Erro ao criar consentimento',
        tipo_cliente: 'PF',
        canal_jornada: 'App to app',
        payload_request: { consentId: 'urn:abc' },
        payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
        endpoint: '/open-banking/consents/v3/consents',
        method: 'POST',
        http_status_code: 422,
      })
    );
  }));

  it('submitIncident exibe erro quando payload_request nao é JSON válido', fakeAsync(() => {
    const fixture = TestBed.createComponent(ApplicationIncidentsPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    component.incidentForm = {
      ...component.incidentForm,
      targetOwnerSlug: 'consentimentos-inbound',
      description: 'Erro',
      payload_request: 'nao-e-json',
      payload_response: '{}',
    };

    void component.submitIncident();
    tick();

    expect(component.incidentSubmitError).toBe('O campo "Payload Request" deve conter JSON válido.');
    expect(apiSpy.reportApplicationIncident).not.toHaveBeenCalled();
  }));

  it('submitIncident exibe erro quando payload_response nao é JSON válido', fakeAsync(() => {
    const fixture = TestBed.createComponent(ApplicationIncidentsPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    component.incidentForm = {
      ...component.incidentForm,
      targetOwnerSlug: 'consentimentos-inbound',
      description: 'Erro',
      payload_request: '{}',
      payload_response: 'nao-e-json',
    };

    void component.submitIncident();
    tick();

    expect(component.incidentSubmitError).toBe('O campo "Payload Response" deve conter JSON válido.');
    expect(apiSpy.reportApplicationIncident).not.toHaveBeenCalled();
  }));

  it('submitIncident exibe erro quando title esta vazio', fakeAsync(() => {
    const fixture = TestBed.createComponent(ApplicationIncidentsPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    component.incidentForm = {
      ...component.incidentForm,
      targetOwnerSlug: 'consentimentos-inbound',
      title: '',
      description: 'Erro',
      payload_request: '{}',
      payload_response: '{}',
    };

    void component.submitIncident();
    tick();

    expect(component.incidentSubmitError).toBe('O campo "Título" é obrigatório.');
    expect(apiSpy.reportApplicationIncident).not.toHaveBeenCalled();
  }));

  it('submitIncident exibe erro quando description esta vazio', fakeAsync(() => {
    const fixture = TestBed.createComponent(ApplicationIncidentsPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    component.incidentForm = {
      ...component.incidentForm,
      targetOwnerSlug: 'consentimentos-inbound',
      title: 'Falha',
      description: '',
      payload_request: '{}',
      payload_response: '{}',
    };

    void component.submitIncident();
    tick();

    expect(component.incidentSubmitError).toBe('O campo "Descrição" é obrigatório.');
    expect(apiSpy.reportApplicationIncident).not.toHaveBeenCalled();
  }));

  it('submitIncident exibe erro quando equipe nao foi selecionada', fakeAsync(() => {
    const fixture = TestBed.createComponent(ApplicationIncidentsPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    component.incidentForm = {
      ...component.incidentForm,
      targetOwnerSlug: '',
      description: 'Erro',
      payload_request: '{}',
      payload_response: '{}',
    };

    void component.submitIncident();
    tick();

    expect(component.incidentSubmitError).toBe('Selecione a equipe responsável pelo incidente.');
    expect(apiSpy.reportApplicationIncident).not.toHaveBeenCalled();
  }));

  it('submitIncident reseta o form e fecha o modal apos sucesso', fakeAsync(() => {
    apiSpy.reportApplicationIncident.and.resolveTo(makeIncident());
    facadeSpy.loadIncidents.and.resolveTo([]);

    const fixture = TestBed.createComponent(ApplicationIncidentsPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    component.isIncidentFormVisible = true;
    component.incidentForm = {
      targetOwnerSlug: 'consentimentos-inbound',
      x_fapi_interaction_id: 'fapi-uuid-001',
      authorization_server: 'auth-uuid-001',
      client_id: 'client-uuid-001',
      endpoint: '/endpoint',
      method: 'POST',
      title: 'Falha',
      description: 'Erro',
      payload_request: '{}',
      payload_response: '{}',
      occurred_at: '2026-04-01T10:00',
      http_status_code: '500',
    };

    void component.submitIncident();
    tick();

    expect(component.incidentSubmitSuccess).toBe('Incidente cadastrado com sucesso.');
    expect(component.isIncidentFormVisible).toBeFalse();
    expect(component.incidentForm.title).toBe('');
    expect(component.incidentForm.description).toBe('');
    expect(component.incidentForm.payload_request).toBe('{\n  \n}');
    expect(component.incidentForm.payload_response).toBe('{\n  \n}');
  }));

  it('buildEmptyIncidentForm inicializa com campos corretos', fakeAsync(() => {
    const fixture = TestBed.createComponent(ApplicationIncidentsPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    const form = component.incidentForm;
    expect(form.title).toBe('');
    expect(form.description).toBe('');
    expect(form.payload_request).toBe('{\n  \n}');
    expect(form.payload_response).toBe('{\n  \n}');
    expect(form.method).toBe('POST');
    expect(form.http_status_code).toBe('500');
  }));
});
