import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { ApplicationIncidentsPageComponent } from './application-incidents-page.component';
import { OpenFinanceApiService } from '../services/open-finance-api.service';
import { ApplicationIncidentsFacadeService } from '../services/application-incidents-facade.service';
import { ApplicationIncident } from '../services/application-incidents.models';

function makeIncident(overrides: Partial<ApplicationIncident> = {}): ApplicationIncident {
  return {
    id: '1', team_slug: 'su-super-usuarios', team_name: 'SU',
    x_fapi_interaction_id: 'f1', authorization_server: 'a1', client_id: 'c1',
    endpoint: '/open-banking/consents/v3/consents', method: 'POST',
    title: 'Falha na criação de consentimento', description: 'Erro ao criar consentimento',
    tipo_cliente: 'PF' as const, canal_jornada: 'App to app',
    payload_request: { consentId: 'urn:abc' }, payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
    occurred_at: '2026-04-01T10:00:00.000Z', http_status_code: 422,
    ticket_context: null, incident_status: 'new', incident_status_label: 'Novo',
    related_ticket_id: null, assigned_to_user_id: null, assigned_to_name: null,
    assigned_to_email: null, created_at: '2026-04-01T10:05:00.000Z',
    updated_at: '2026-04-01T10:05:00.000Z',
    ...overrides,
  };
}

const validForm = {
  targetOwnerSlug: 'consentimentos-inbound',
  x_fapi_interaction_id: 'f1', authorization_server: 'a1', client_id: 'c1',
  endpoint: '/endpoint', method: 'POST',
  title: 'Falha', description: 'Erro',
  tipo_cliente: 'PF' as const, canal_jornada: 'APP_TO_APP' as const,
  payload_request: '{"consentId":"urn:abc"}',
  payload_response: '{"error":"DETALHE_PGTO_INVALIDO"}',
  occurred_at: '2026-04-01T10:00', http_status_code: '422',
};

describe('ApplicationIncidentsPageComponent', () => {
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let facadeSpy: jasmine.SpyObj<ApplicationIncidentsFacadeService>;

  function createComponent() {
    const fixture = TestBed.createComponent(ApplicationIncidentsPageComponent);
    fixture.detectChanges();
    tick();
    return fixture.componentInstance as any;
  }

  beforeEach(async () => {
    sessionStorage.clear();

    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', ['reportApplicationIncident']);
    facadeSpy = jasmine.createSpyObj<ApplicationIncidentsFacadeService>('ApplicationIncidentsFacadeService', [
      'loadIncidents', 'getCachedIncidents', 'syncIncident', 'invalidateOwner', 'getLoadErrorMessage',
    ]);
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
              subscribe: (fn: (p: any) => void) => {
                fn(convertToParamMap({ ownerSlug: 'su-super-usuarios' }));
                return { unsubscribe: () => {} };
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('envia payload completo ao API quando o formulário é válido', fakeAsync(() => {
    apiSpy.reportApplicationIncident.and.resolveTo(makeIncident());
    const c = createComponent();
    c.incidentForm = { ...validForm };

    void c.submitIncident();
    tick();

    expect(apiSpy.reportApplicationIncident).toHaveBeenCalledWith(
      'consentimentos-inbound',
      jasmine.objectContaining({
        title: 'Falha', description: 'Erro', tipo_cliente: 'PF',
        canal_jornada: 'APP_TO_APP',
        payload_request: { consentId: 'urn:abc' },
        payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
        http_status_code: 422,
      })
    );
  }));

  it('buildEmptyIncidentForm preenche occurred_at em formato local para datetime-local', fakeAsync(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-04-08T15:00:00.000Z'));

    try {
      const c = createComponent();
      expect(c.incidentForm.occurred_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(c.incidentForm.occurred_at.endsWith('Z')).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  }));

  it('reseta formulário e exibe confirmação após envio bem-sucedido', fakeAsync(() => {
    apiSpy.reportApplicationIncident.and.resolveTo(makeIncident());
    const c = createComponent();
    c.isIncidentFormVisible = true;
    c.incidentForm = { ...validForm };

    void c.submitIncident();
    tick();

    expect(c.incidentSubmitSuccess).toBe('Incidente cadastrado com sucesso.');
    expect(c.isIncidentFormVisible).toBeFalse();
    expect(c.incidentForm.title).toBe('');
    expect(c.incidentForm.description).toBe('');
  }));

  const validacoes: Array<[string, Partial<typeof validForm>, string]> = [
    ['payload_request inválido',  { payload_request: 'nao-json' },  'O campo "Payload Request" deve conter JSON válido.'],
    ['payload_response inválido', { payload_response: 'nao-json' }, 'O campo "Payload Response" deve conter JSON válido.'],
    ['título vazio',              { title: '' },                     'O campo "Título" é obrigatório.'],
    ['descrição vazia',           { description: '' },               'O campo "Descrição" é obrigatório.'],
    ['equipe não selecionada',    { targetOwnerSlug: '' },           'Selecione a equipe responsável pelo incidente.'],
  ];

  validacoes.forEach(([desc, override, mensagemEsperada]) => {
    it(`bloqueia envio e exibe erro quando ${desc}`, fakeAsync(() => {
      const c = createComponent();
      c.incidentForm = { ...validForm, ...override };

      void c.submitIncident();
      tick();

      expect(c.incidentSubmitError).toBe(mensagemEsperada);
      expect(apiSpy.reportApplicationIncident).not.toHaveBeenCalled();
    }));
  });
});
