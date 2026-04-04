import { TestBed } from '@angular/core/testing';

import { ApplicationIncidentsService } from './application-incidents.service';
import { ApplicationIncident } from './application-incidents.models';

function makeIncident(overrides: Partial<ApplicationIncident> = {}): ApplicationIncident {
  return {
    id: '1',
    team_slug: 'consentimentos-inbound',
    team_name: 'Consentimentos Inbound',
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

describe('ApplicationIncidentsService', () => {
  let service: ApplicationIncidentsService;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [ApplicationIncidentsService],
    });

    service = TestBed.inject(ApplicationIncidentsService);
  });

  describe('mapIncidentItem', () => {
    it('usa title como summary do incidente', () => {
      const item = service.mapIncidentItem(makeIncident({ title: 'Falha na criação de consentimento' }));
      expect(item.summary).toBe('Falha na criação de consentimento');
    });

    it('usa "Sem título" quando title é nulo', () => {
      const item = service.mapIncidentItem(makeIncident({ title: null }));
      expect(item.summary).toBe('Sem título');
    });

    it('usa "Sem título" quando title é vazio', () => {
      const item = service.mapIncidentItem(makeIncident({ title: '' }));
      expect(item.summary).toBe('Sem título');
    });

    it('mapeia os campos de identificacao corretamente', () => {
      const item = service.mapIncidentItem(makeIncident());
      expect(item.id).toBe('1');
      expect(item.endpoint).toBe('/open-banking/consents/v3/consents');
      expect(item.method).toBe('POST');
      expect(item.statusCodeLabel).toBe('HTTP 422');
      expect(item.incidentStatus).toBe('new');
      expect(item.incidentStatusLabel).toBe('Novo');
      expect(item.relatedTicketId).toBeNull();
    });

    it('formata statusCodeLabel como "HTTP N/A" quando http_status_code é nulo', () => {
      const item = service.mapIncidentItem(makeIncident({ http_status_code: null }));
      expect(item.statusCodeLabel).toBe('HTTP N/A');
    });

    it('retorna relatedTicketId preenchido quando existe', () => {
      const item = service.mapIncidentItem(makeIncident({ related_ticket_id: '99' }));
      expect(item.relatedTicketId).toBe('99');
    });

    it('parseia occurred_at e created_at em ms para ordenacao', () => {
      const item = service.mapIncidentItem(makeIncident());
      expect(item.dataHoraMs).toBeGreaterThan(0);
      expect(item.createdAtMs).toBeGreaterThan(0);
    });

    it('retorna dataHora como "Sem data" quando occurred_at é nulo', () => {
      const item = service.mapIncidentItem(makeIncident({ occurred_at: null }));
      expect(item.dataHora).toBe('Sem data');
      expect(item.dataHoraMs).toBe(0);
    });
  });

  describe('mapIncidentListPayload', () => {
    it('ordena por occurred_at decrescente', () => {
      const incidents = [
        makeIncident({ id: '1', occurred_at: '2026-04-01T08:00:00.000Z', created_at: '2026-04-01T08:01:00.000Z' }),
        makeIncident({ id: '2', occurred_at: '2026-04-02T08:00:00.000Z', created_at: '2026-04-02T08:01:00.000Z' }),
        makeIncident({ id: '3', occurred_at: '2026-04-01T06:00:00.000Z', created_at: '2026-04-01T06:01:00.000Z' }),
      ];

      const result = service.mapIncidentListPayload(incidents);
      expect(result.map((i) => i.id)).toEqual(['2', '1', '3']);
    });

    it('usa created_at como desempate quando occurred_at é igual', () => {
      const sameOccurredAt = '2026-04-01T10:00:00.000Z';
      const incidents = [
        makeIncident({ id: 'A', occurred_at: sameOccurredAt, created_at: '2026-04-01T10:00:01.000Z' }),
        makeIncident({ id: 'B', occurred_at: sameOccurredAt, created_at: '2026-04-01T10:00:03.000Z' }),
      ];

      const result = service.mapIncidentListPayload(incidents);
      expect(result.map((i) => i.id)).toEqual(['B', 'A']);
    });

    it('retorna array vazio para payload invalido', () => {
      expect(service.mapIncidentListPayload(null)).toEqual([]);
      expect(service.mapIncidentListPayload('string')).toEqual([]);
      expect(service.mapIncidentListPayload(undefined)).toEqual([]);
    });
  });

  describe('cache', () => {
    it('guarda e recupera incidents por equipe', () => {
      const items = service.mapIncidentListPayload([makeIncident()]);
      service.setIncidents('equipe-a', items);

      expect(service.getIncidents('equipe-a').length).toBe(1);
      expect(service.getIncidents('equipe-b').length).toBe(0);
    });

    it('hasFreshIncidents respeita TTL', () => {
      spyOn(Date, 'now').and.returnValues(1000, 1500, 200000);

      service.setIncidents('equipe-a', []);
      expect(service.hasFreshIncidents('equipe-a')).toBeTrue();
      expect(service.hasFreshIncidents('equipe-a')).toBeFalse();
    });

    it('invalidateOwner remove o cache da equipe', () => {
      const items = service.mapIncidentListPayload([makeIncident()]);
      service.setIncidents('equipe-a', items);
      service.invalidateOwner('equipe-a');

      expect(service.getIncidents('equipe-a').length).toBe(0);
    });

    it('syncIncident atualiza incidente existente mantendo ordenacao', () => {
      const older = makeIncident({ id: '1', occurred_at: '2026-04-01T08:00:00.000Z', created_at: '2026-04-01T08:00:00.000Z' });
      const newer = makeIncident({ id: '2', occurred_at: '2026-04-02T08:00:00.000Z', created_at: '2026-04-02T08:00:00.000Z' });
      service.setIncidents('equipe-a', service.mapIncidentListPayload([older, newer]));

      const updatedOlder = makeIncident({
        id: '1',
        occurred_at: '2026-04-01T08:00:00.000Z',
        created_at: '2026-04-01T08:00:00.000Z',
        incident_status: 'assigned',
        incident_status_label: 'Atribuido',
      });
      service.syncIncident('equipe-a', updatedOlder);

      const cached = service.getIncidents('equipe-a');
      expect(cached.length).toBe(2);
      expect(cached[0].id).toBe('2');
      expect(cached[1].incidentStatusLabel).toBe('Atribuido');
    });

    it('clearCache remove todos os incidents', () => {
      service.setIncidents('equipe-a', service.mapIncidentListPayload([makeIncident()]));
      service.clearCache();

      expect(service.getIncidents('equipe-a').length).toBe(0);
      expect(sessionStorage.getItem('open-finance-application-incidents-v1')).toBeNull();
    });
  });
});
