import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ApplicationIncidentsFacadeService } from './application-incidents-facade.service';
import { ApplicationIncident, ApplicationIncidentListItem } from './application-incidents.models';
import { ApplicationIncidentsService } from './application-incidents.service';
import { OpenFinanceApiService } from './open-finance-api.service';

function makeIncident(overrides: Partial<ApplicationIncident> = {}): ApplicationIncident {
  return {
    id: '1',
    team_slug: 'iniciadora-pagamentos',
    team_name: 'Iniciadora de Pagamentos',
    x_fapi_interaction_id: 'fapi-001',
    authorization_server: 'auth-001',
    client_id: 'client-001',
    endpoint: '/open-banking/payments/v4/pix/payments',
    method: 'POST',
    title: 'Falha no pagamento',
    description: 'Erro ao processar pagamento',
    tipo_cliente: 'PJ' as const,
    canal_jornada: 'App to app',
    payload_request: {},
    payload_response: { error: 'SALDO_INSUFICIENTE' },
    occurred_at: '2026-04-05T09:00:00.000Z',
    http_status_code: 422,
    ticket_context: null,
    incident_status: 'new',
    incident_status_label: 'Novo',
    related_ticket_id: null,
    assigned_to_user_id: null,
    assigned_to_name: null,
    assigned_to_email: null,
    created_at: '2026-04-05T09:01:00.000Z',
    updated_at: '2026-04-05T09:01:00.000Z',
    ...overrides,
  };
}

describe('ApplicationIncidentsFacadeService', () => {
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let incidentsServiceSpy: jasmine.SpyObj<ApplicationIncidentsService>;
  let service: ApplicationIncidentsFacadeService;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', [
      'listApplicationIncidents',
    ]);
    incidentsServiceSpy = jasmine.createSpyObj<ApplicationIncidentsService>(
      'ApplicationIncidentsService',
      [
        'getIncidents',
        'hasFreshIncidents',
        'mapIncidentListPayload',
        'setIncidents',
        'syncIncident',
        'invalidateOwner',
      ]
    );

    TestBed.configureTestingModule({
      providers: [
        ApplicationIncidentsFacadeService,
        { provide: OpenFinanceApiService, useValue: apiSpy },
        { provide: ApplicationIncidentsService, useValue: incidentsServiceSpy },
      ],
    });

    service = TestBed.inject(ApplicationIncidentsFacadeService);
  });

  describe('getCachedIncidents', () => {
    it('delega para applicationIncidentsService.getIncidents', () => {
      const items: ApplicationIncidentListItem[] = [];
      incidentsServiceSpy.getIncidents.and.returnValue(items);

      const result = service.getCachedIncidents('iniciadora-pagamentos');

      expect(incidentsServiceSpy.getIncidents).toHaveBeenCalledOnceWith('iniciadora-pagamentos');
      expect(result).toBe(items);
    });
  });

  describe('hasFreshIncidents', () => {
    it('delega para applicationIncidentsService.hasFreshIncidents', () => {
      incidentsServiceSpy.hasFreshIncidents.and.returnValue(false);

      const result = service.hasFreshIncidents('detentora-pagamentos');

      expect(incidentsServiceSpy.hasFreshIncidents).toHaveBeenCalledOnceWith(
        'detentora-pagamentos'
      );
      expect(result).toBeFalse();
    });
  });

  describe('loadIncidents', () => {
    it('carrega incidentes da API, mapeia e armazena em cache', async () => {
      const rawPayload = [makeIncident()];
      const mappedItems: ApplicationIncidentListItem[] = [
        {
          id: '1',
          summary: 'Falha no pagamento',
          endpoint: '/open-banking/payments/v4/pix/payments',
          method: 'POST',
          statusCodeLabel: 'HTTP 422',
          dataHora: '05-04-2026 09:00:00',
          dataHoraMs: 1000,
          incidentStatus: 'new',
          incidentStatusLabel: 'Novo',
          relatedTicketId: null,
          createdAt: '05-04-2026 09:01:00',
          createdAtMs: 1001,
        },
      ];

      apiSpy.listApplicationIncidents.and.resolveTo(rawPayload as never);
      incidentsServiceSpy.mapIncidentListPayload.and.returnValue(mappedItems);

      const result = await service.loadIncidents('iniciadora-pagamentos');

      expect(apiSpy.listApplicationIncidents).toHaveBeenCalledOnceWith('iniciadora-pagamentos');
      expect(incidentsServiceSpy.mapIncidentListPayload).toHaveBeenCalledOnceWith(rawPayload);
      expect(incidentsServiceSpy.setIncidents).toHaveBeenCalledOnceWith(
        'iniciadora-pagamentos',
        mappedItems
      );
      expect(result).toEqual(mappedItems);
    });
  });

  describe('syncIncident', () => {
    it('delega para applicationIncidentsService.syncIncident', () => {
      const incident = makeIncident();

      service.syncIncident('consentimentos-inbound', incident);

      expect(incidentsServiceSpy.syncIncident).toHaveBeenCalledOnceWith(
        'consentimentos-inbound',
        incident
      );
    });
  });

  describe('invalidateOwner', () => {
    it('delega para applicationIncidentsService.invalidateOwner', () => {
      service.invalidateOwner('servicos-outbound');

      expect(incidentsServiceSpy.invalidateOwner).toHaveBeenCalledOnceWith('servicos-outbound');
    });
  });

  describe('getLoadErrorMessage', () => {
    it('retorna mensagem de sessao para erro 401', () => {
      const error = new HttpErrorResponse({ status: 401 });
      expect(service.getLoadErrorMessage(error)).toBe(
        'Nao foi possivel renovar a sessao automaticamente.'
      );
    });

    it('retorna mensagem com status para outros erros HTTP', () => {
      const error = new HttpErrorResponse({ status: 500 });
      expect(service.getLoadErrorMessage(error)).toBe('Falha ao consultar incidentes (500).');
    });

    it('retorna mensagem do Error', () => {
      const error = new Error('Conexao recusada');
      expect(service.getLoadErrorMessage(error)).toBe('Conexao recusada');
    });

    it('retorna mensagem generica para erros desconhecidos', () => {
      expect(service.getLoadErrorMessage(null)).toBe('Nao foi possivel consultar incidentes.');
      expect(service.getLoadErrorMessage(42)).toBe('Nao foi possivel consultar incidentes.');
    });
  });
});
