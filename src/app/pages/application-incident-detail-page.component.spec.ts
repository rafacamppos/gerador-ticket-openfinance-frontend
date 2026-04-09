import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { ApplicationIncidentDetailPageComponent } from './application-incident-detail-page.component';
import { OpenFinanceApiService } from '../services/open-finance-api.service';
import { ApplicationIncidentsFacadeService } from '../services/application-incidents-facade.service';
import { PortalAuthService } from '../services/portal-auth.service';
import { ApplicationIncident, TicketPreview } from '../services/application-incidents.models';

type Comp = ApplicationIncidentDetailPageComponent & {
  isLoading: boolean; errorMessage: string;
  incident: ApplicationIncident | null;
  ticketPreview: TicketPreview | null;
  ticketForm: { title: string; description: string; template_fields: Array<{ key: string; value: string }> };
  isCreateTicketModalVisible: boolean; isCreatingTicket: boolean; isLoadingTicketPreview: boolean;
  ticketCreateError: string; ticketCreateSuccess: string;
  hasRelatedTicket(): boolean;
  openCreateTicketModal(): Promise<void>;
  closeCreateTicketModal(): void;
  createTicket(): Promise<void>;
  formatValue(v: unknown): string;
};

function makeIncident(overrides: Partial<ApplicationIncident> = {}): ApplicationIncident {
  return {
    id: '4', team_slug: 'consentimentos-inbound', team_name: 'Consentimentos Inbound',
    x_fapi_interaction_id: 'fapi-uuid-001', authorization_server: 'auth-uuid-001', client_id: 'client-uuid-001',
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

function makeTicketPreview(): TicketPreview {
  return {
    template_id: '123328', template_type: 1,
    title: 'Falha na criação de consentimento', description: 'Erro ao criar consentimento',
    template_fields: [
      { key: 'CustomColumn120sr', label: 'Tipo do Cliente', required: true, value: 'PF', options: ['PF', 'PJ'] },
      { key: 'CustomColumn174sr', label: 'Canal da Jornada', required: true, value: 'App to app', options: ['App to app', 'App to browser'] },
    ],
  };
}

describe('ApplicationIncidentDetailPageComponent', () => {
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let facadeSpy: jasmine.SpyObj<ApplicationIncidentsFacadeService>;
  let authSpy: jasmine.SpyObj<PortalAuthService>;

  function create(): Comp {
    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    fixture.detectChanges();
    tick();
    return fixture.componentInstance as unknown as Comp;
  }

  beforeEach(async () => {
    sessionStorage.clear();

    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', [
      'getApplicationIncidentById', 'assignApplicationIncidentToMe', 'transitionApplicationIncident',
      'listTicketStatuses', 'getTicketPreview', 'createIncidentTicket', 'updateTicket',
    ]);
    facadeSpy = jasmine.createSpyObj<ApplicationIncidentsFacadeService>('ApplicationIncidentsFacadeService', ['syncIncident']);
    authSpy = jasmine.createSpyObj<PortalAuthService>('PortalAuthService', ['getUser']);
    authSpy.getUser.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [ApplicationIncidentDetailPageComponent],
      providers: [
        provideRouter([]),
        { provide: OpenFinanceApiService, useValue: apiSpy },
        { provide: ApplicationIncidentsFacadeService, useValue: facadeSpy },
        { provide: PortalAuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: {
            snapshot: { paramMap: convertToParamMap({ ownerSlug: 'consentimentos-inbound', incidentId: '4' }) },
          },
        },
      ],
    }).compileComponents();
  });

  describe('carregamento inicial', () => {
    it('carrega incidente ao iniciar', fakeAsync(() => {
      apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
      const c = create();
      expect(apiSpy.getApplicationIncidentById).toHaveBeenCalledWith('consentimentos-inbound', '4');
      expect(c.incident).toBeTruthy();
      expect(c.isLoading).toBeFalse();
    }));

    it('exibe mensagem de erro quando API falha', fakeAsync(() => {
      apiSpy.getApplicationIncidentById.and.rejectWith(new Error('API indisponível'));
      const c = create();
      expect(c.errorMessage).toBe('API indisponível');
      expect(c.isLoading).toBeFalse();
    }));
  });

  describe('modal de criação de ticket', () => {
    beforeEach(fakeAsync(() => {
      apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
    }));

    it('openCreateTicketModal carrega preview e inicializa form', fakeAsync(() => {
      const c = create();
      apiSpy.getTicketPreview.and.resolveTo(makeTicketPreview());
      c.ticketCreateError = 'Erro anterior';
      c.ticketCreateSuccess = 'Sucesso anterior';

      void c.openCreateTicketModal(); tick();

      expect(c.ticketCreateError).toBe('');
      expect(c.ticketCreateSuccess).toBe('');
      expect(c.ticketForm).toEqual({
        title: 'Falha na criação de consentimento',
        description: 'Erro ao criar consentimento',
        template_fields: [
          { key: 'CustomColumn120sr', value: 'PF' },
          { key: 'CustomColumn174sr', value: 'App to app' },
        ],
      });
      expect(c.isCreateTicketModalVisible).toBeTrue();
    }));

    it('não abre modal quando incidente já possui ticket relacionado', fakeAsync(() => {
      apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident({ related_ticket_id: '777' }));
      const c = create();
      void c.openCreateTicketModal(); tick();
      expect(c.isCreateTicketModalVisible).toBeFalse();
    }));

    it('closeCreateTicketModal não fecha enquanto cria ticket', fakeAsync(() => {
      const c = create();
      c.isCreateTicketModalVisible = true;
      c.isCreatingTicket = true;
      c.closeCreateTicketModal();
      expect(c.isCreateTicketModalVisible).toBeTrue();
    }));
  });

  describe('createTicket', () => {
    function setupCreateTicket(ticketId: string): void {
      apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
      apiSpy.listTicketStatuses.and.resolveTo([{ id: '1', name: 'NOVO' }]);
      apiSpy.createIncidentTicket.and.resolveTo({
        incident: makeIncident({ incident_status: 'ticket_created', related_ticket_id: ticketId }),
        ticket_id: ticketId, ticket: { id: Number(ticketId) },
      });
      apiSpy.updateTicket.and.resolveTo({});
    }

    it('chama API com payload correto', fakeAsync(() => {
      setupCreateTicket('999');
      const c = create();
      c.ticketPreview = makeTicketPreview();
      c.ticketForm = {
        title: 'Falha na criação de consentimento',
        description: 'Erro ao criar consentimento',
        template_fields: [{ key: 'CustomColumn120sr', value: 'PF' }, { key: 'CustomColumn174sr', value: 'App to app' }],
      };

      void c.createTicket(); tick();

      expect(apiSpy.createIncidentTicket).toHaveBeenCalledWith('consentimentos-inbound', '4',
        jasmine.objectContaining({ title: 'Falha na criação de consentimento' }));
      expect(apiSpy.updateTicket).toHaveBeenCalledWith('999',
        jasmine.objectContaining({ info: [{ key: 'status', value: '1' }] }));
    }));

    it('exibe sucesso e sincroniza cache após criar ticket', fakeAsync(() => {
      setupCreateTicket('777');
      const c = create();
      c.ticketPreview = makeTicketPreview();
      c.ticketForm = { title: 'T', description: 'D', template_fields: [] };

      void c.createTicket(); tick();

      expect(c.incident!.incident_status).toBe('ticket_created');
      expect(c.ticketCreateSuccess).toBe('Ticket #777 criado com sucesso.');
      expect(c.isCreateTicketModalVisible).toBeFalse();
      expect(facadeSpy.syncIncident).toHaveBeenCalled();
    }));

    it('exibe erro quando API falha', fakeAsync(() => {
      apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
      apiSpy.listTicketStatuses.and.resolveTo([{ id: '1', name: 'NOVO' }]);
      apiSpy.createIncidentTicket.and.rejectWith(new Error('Campos obrigatórios não preenchidos'));
      const c = create();
      c.ticketPreview = makeTicketPreview();
      c.ticketForm = { title: 'T', description: 'D', template_fields: [] };

      void c.createTicket(); tick();

      expect(c.ticketCreateError).toBe('Campos obrigatórios não preenchidos');
      expect(c.isCreatingTicket).toBeFalse();
    }));

    it('exibe erro quando status NOVO não está na lista', fakeAsync(() => {
      apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
      apiSpy.listTicketStatuses.and.resolveTo([{ id: '2', name: 'EM ANÁLISE N1' }]);
      apiSpy.createIncidentTicket.and.resolveTo({
        incident: makeIncident({ related_ticket_id: '777' }), ticket_id: '777', ticket: { id: 777 },
      });
      const c = create();
      c.ticketPreview = makeTicketPreview();
      c.ticketForm = { title: 'T', description: 'D', template_fields: [] };

      void c.createTicket(); tick();

      expect(c.ticketCreateError).toBe('Status "NOVO" não encontrado.');
      expect(apiSpy.updateTicket).not.toHaveBeenCalled();
    }));
  });

  describe('formatValue', () => {
    beforeEach(fakeAsync(() => {
      apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
    }));

    it('retorna "Nao informado" para null, undefined e string vazia e serializa objetos como JSON', fakeAsync(() => {
      const c = create();
      expect(c.formatValue(null)).toBe('Nao informado');
      expect(c.formatValue(undefined)).toBe('Nao informado');
      expect(c.formatValue('')).toBe('Nao informado');
      expect(c.formatValue({ error: 'DETALHE_PGTO_INVALIDO' }))
        .toBe(JSON.stringify({ error: 'DETALHE_PGTO_INVALIDO' }, null, 2));
    }));
  });
});
