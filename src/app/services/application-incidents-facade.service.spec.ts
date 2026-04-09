import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ApplicationIncidentsFacadeService } from './application-incidents-facade.service';
import { ApplicationIncident } from './application-incidents.models';
import { ApplicationIncidentsService } from './application-incidents.service';
import { OpenFinanceApiService } from './open-finance-api.service';

function makeIncident(overrides: Partial<ApplicationIncident> = {}): ApplicationIncident {
  return {
    id: '1', team_slug: 'iniciadora-pagamentos', team_name: 'IP',
    x_fapi_interaction_id: 'f1', authorization_server: 'a1', client_id: 'c1',
    endpoint: '/payments', method: 'POST', title: 'Falha', description: 'Erro',
    tipo_cliente: 'PJ' as const, canal_jornada: 'App to app',
    payload_request: {}, payload_response: {},
    occurred_at: '2026-04-05T09:00:00.000Z', http_status_code: 422,
    ticket_context: null, incident_status: 'new', incident_status_label: 'Novo',
    related_ticket_id: null, assigned_to_user_id: null, assigned_to_name: null,
    assigned_to_email: null, created_at: '2026-04-05T09:01:00.000Z',
    updated_at: '2026-04-05T09:01:00.000Z',
    ...overrides,
  };
}

describe('ApplicationIncidentsFacadeService', () => {
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let incidentsServiceSpy: jasmine.SpyObj<ApplicationIncidentsService>;
  let service: ApplicationIncidentsFacadeService;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', ['listApplicationIncidents']);
    incidentsServiceSpy = jasmine.createSpyObj<ApplicationIncidentsService>('ApplicationIncidentsService', [
      'getIncidents', 'hasFreshIncidents', 'mapIncidentListPayload', 'setIncidents', 'syncIncident', 'invalidateOwner',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ApplicationIncidentsFacadeService,
        { provide: OpenFinanceApiService, useValue: apiSpy },
        { provide: ApplicationIncidentsService, useValue: incidentsServiceSpy },
      ],
    });

    service = TestBed.inject(ApplicationIncidentsFacadeService);
  });

  it('loadIncidents busca da API, mapeia e salva em cache', async () => {
    const raw = [makeIncident()];
    const mapped = [{ id: '1', summary: 'Falha', endpoint: '/payments', method: 'POST',
      statusCodeLabel: 'HTTP 422', dataHora: '05-04-2026', dataHoraMs: 1000,
      incidentStatus: 'new', incidentStatusLabel: 'Novo', relatedTicketId: null,
      createdAt: '05-04-2026', createdAtMs: 1001 }];

    apiSpy.listApplicationIncidents.and.resolveTo(raw as never);
    incidentsServiceSpy.mapIncidentListPayload.and.returnValue(mapped);

    const result = await service.loadIncidents('iniciadora-pagamentos');

    expect(apiSpy.listApplicationIncidents).toHaveBeenCalledOnceWith('iniciadora-pagamentos');
    expect(incidentsServiceSpy.setIncidents).toHaveBeenCalledOnceWith('iniciadora-pagamentos', mapped);
    expect(result).toEqual(mapped);
  });

  describe('getLoadErrorMessage', () => {
    const casos: Array<[string, unknown, string]> = [
      ['401',          new HttpErrorResponse({ status: 401 }), 'Nao foi possivel renovar a sessao automaticamente.'],
      ['500',          new HttpErrorResponse({ status: 500 }), 'Falha ao consultar incidentes (500).'],
      ['Error',        new Error('Timeout'),                   'Timeout'],
      ['desconhecido', null,                                   'Nao foi possivel consultar incidentes.'],
    ];

    casos.forEach(([label, err, expected]) => {
      it(`formata mensagem para erro ${label}`, () => {
        expect(service.getLoadErrorMessage(err)).toBe(expected);
      });
    });
  });
});
