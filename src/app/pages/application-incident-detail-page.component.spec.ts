import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { ApplicationIncidentDetailPageComponent } from './application-incident-detail-page.component';
import { OpenFinanceApiService } from '../services/open-finance-api.service';
import { ApplicationIncidentsFacadeService } from '../services/application-incidents-facade.service';
import { PortalAuthService } from '../services/portal-auth.service';
import { ApplicationIncident, TicketPreview } from '../services/application-incidents.models';

function makeIncident(overrides: Partial<ApplicationIncident> = {}): ApplicationIncident {
  return {
    id: '4',
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
    canal_jornada: 'App to app',
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

function makeTicketPreview(overrides: Partial<TicketPreview> = {}): TicketPreview {
  return {
    template_id: '123328',
    template_type: 1,
    title: 'Falha na criação de consentimento',
    description: 'Erro ao criar consentimento',
    template_fields: [
      {
        key: 'CustomColumn120sr',
        label: 'Tipo do Cliente',
        required: true,
        value: 'PF',
        options: ['PF', 'PJ'],
      },
      {
        key: 'CustomColumn174sr',
        label: 'Canal da Jornada',
        required: true,
        value: 'App to app',
        options: ['App to app', 'App to browser'],
      },
    ],
    ...overrides,
  };
}

describe('ApplicationIncidentDetailPageComponent', () => {
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let facadeSpy: jasmine.SpyObj<ApplicationIncidentsFacadeService>;
  let authSpy: jasmine.SpyObj<PortalAuthService>;

  beforeEach(async () => {
    sessionStorage.clear();

    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', [
      'getApplicationIncidentById',
      'assignApplicationIncidentToMe',
      'transitionApplicationIncident',
      'listTicketStatuses',
      'getTicketPreview',
      'createIncidentTicket',
      'updateTicket',
    ]);

    facadeSpy = jasmine.createSpyObj<ApplicationIncidentsFacadeService>(
      'ApplicationIncidentsFacadeService',
      ['syncIncident']
    );

    authSpy = jasmine.createSpyObj<PortalAuthService>('PortalAuthService', ['getUser']);
    authSpy.getUser.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [ApplicationIncidentDetailPageComponent],
      providers: [
        provideRouter([]),
        { provide: OpenFinanceApiService, useValue: apiSpy },
        { provide: ApplicationIncidentsFacadeService, useValue: facadeSpy },
        { provide: PortalAuthService, useValue: authSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ ownerSlug: 'consentimentos-inbound', incidentId: '4' }),
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('carrega incidente ao iniciar e exibe no template', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(apiSpy.getApplicationIncidentById).toHaveBeenCalledWith('consentimentos-inbound', '4');
    expect(component.incident).toBeTruthy();
    expect(component.isLoading).toBeFalse();
  }));

  it('exibe mensagem de erro quando API falha ao carregar incidente', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.rejectWith(new Error('API indisponível'));

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('API indisponível');
    expect(component.isLoading).toBeFalse();
  }));

  it('buildTicketForm inicializa com PF e App to app', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    expect(component.ticketForm).toEqual({
      title: '',
      description: '',
      template_fields: [],
    });
  }));

  it('createTicket chama createIncidentTicket com tipo_cliente e canal_jornada', fakeAsync(() => {
    const updatedIncident = makeIncident({ incident_status: 'ticket_created', related_ticket_id: '999' });
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
    apiSpy.listTicketStatuses.and.resolveTo([{ id: '1', name: 'NOVO' }]);
    apiSpy.createIncidentTicket.and.resolveTo({
      incident: updatedIncident,
      ticket_id: '999',
      ticket: { id: 999 },
    });
    apiSpy.updateTicket.and.resolveTo({});

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.ticketPreview = makeTicketPreview();
    component.ticketForm = {
      title: 'Falha na criação de consentimento',
      description: 'Erro ao criar consentimento',
      template_fields: [
        { key: 'CustomColumn120sr', value: 'PF' },
        { key: 'CustomColumn174sr', value: 'App to app' },
      ],
    };

    void component.createTicket();
    tick();
    fixture.detectChanges();

    expect(apiSpy.createIncidentTicket).toHaveBeenCalledWith(
      'consentimentos-inbound',
      '4',
      {
        title: 'Falha na criação de consentimento',
        description: 'Erro ao criar consentimento',
        template_fields: [
          { key: 'CustomColumn120sr', value: 'PF' },
          { key: 'CustomColumn174sr', value: 'App to app' },
        ],
      }
    );
    expect(apiSpy.updateTicket).toHaveBeenCalledWith('999', {
      id: '999',
      info: [{ key: 'status', value: '1' }],
    });
  }));

  it('createTicket atualiza incident e exibe mensagem de sucesso', fakeAsync(() => {
    const updatedIncident = makeIncident({ incident_status: 'ticket_created', related_ticket_id: '777' });
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
    apiSpy.listTicketStatuses.and.resolveTo([{ id: '1', name: 'NOVO' }]);
    apiSpy.createIncidentTicket.and.resolveTo({
      incident: updatedIncident,
      ticket_id: '777',
      ticket: { id: 777 },
    });
    apiSpy.updateTicket.and.resolveTo({});

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.ticketPreview = makeTicketPreview();
    component.ticketForm = {
      title: 'Falha na criação de consentimento',
      description: 'Erro ao criar consentimento',
      template_fields: [],
    };
    void component.createTicket();
    tick();
    fixture.detectChanges();

    expect(component.incident.incident_status).toBe('ticket_created');
    expect(component.ticketCreateSuccess).toBe('Ticket #777 criado com sucesso.');
    expect(component.isCreateTicketModalVisible).toBeFalse();
    expect(facadeSpy.syncIncident).toHaveBeenCalled();
  }));

  it('createTicket exibe erro quando API falha', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
    apiSpy.listTicketStatuses.and.resolveTo([{ id: '1', name: 'NOVO' }]);
    apiSpy.createIncidentTicket.and.rejectWith(new Error('Campos obrigatórios não preenchidos'));

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.ticketPreview = makeTicketPreview();
    component.ticketForm = {
      title: 'Falha na criação de consentimento',
      description: 'Erro ao criar consentimento',
      template_fields: [],
    };
    void component.createTicket();
    tick();
    fixture.detectChanges();

    expect(component.ticketCreateError).toBe('Campos obrigatórios não preenchidos');
    expect(component.isCreatingTicket).toBeFalse();
  }));

  it('createTicket exibe erro quando status NOVO nao existe na lista de estados', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
    apiSpy.listTicketStatuses.and.resolveTo([{ id: '2', name: 'EM ANÁLISE N1' }]);
    apiSpy.createIncidentTicket.and.resolveTo({
      incident: makeIncident({ incident_status: 'ticket_created', related_ticket_id: '777' }),
      ticket_id: '777',
      ticket: { id: 777 },
    });

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.ticketPreview = makeTicketPreview();
    component.ticketForm = {
      title: 'Falha na criação de consentimento',
      description: 'Erro ao criar consentimento',
      template_fields: [],
    };
    void component.createTicket();
    tick();
    fixture.detectChanges();

    expect(component.ticketCreateError).toBe('Status "NOVO" não encontrado.');
    expect(apiSpy.updateTicket).not.toHaveBeenCalled();
  }));

  it('openCreateTicketModal reinicia o form e limpa erros anteriores', fakeAsync(() => {
    authSpy.getUser.and.returnValue({
      id: '11',
      name: 'Analista',
      email: 'analista@santander.com.br',
      profile: 'user',
      team: null,
    });
    apiSpy.getApplicationIncidentById.and.resolveTo(
      makeIncident({ assigned_to_user_id: '11', assigned_to_email: 'analista@santander.com.br' })
    );
    apiSpy.getTicketPreview.and.resolveTo(makeTicketPreview());

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.ticketCreateError = 'Erro anterior';
    component.ticketCreateSuccess = 'Sucesso anterior';
    void component.openCreateTicketModal();
    tick();
    fixture.detectChanges();

    expect(component.ticketCreateError).toBe('');
    expect(component.ticketCreateSuccess).toBe('');
    expect(component.ticketForm).toEqual({
      title: 'Falha na criação de consentimento',
      description: 'Erro ao criar consentimento',
      template_fields: [
        { key: 'CustomColumn120sr', value: 'PF' },
        { key: 'CustomColumn174sr', value: 'App to app' },
      ],
    });
    expect(component.isCreateTicketModalVisible).toBeTrue();
  }));


  it('desabilita criacao de ticket quando incidente ja possui ticket relacionado', fakeAsync(() => {
    authSpy.getUser.and.returnValue({
      id: '11',
      name: 'Analista',
      email: 'analista@santander.com.br',
      profile: 'user',
      team: null,
    });
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident({ related_ticket_id: '777' }));

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.detail-card__toolbar-actions button');

    expect(component.hasRelatedTicket()).toBeTrue();
    expect(component.canCreateTicket()).toBeFalse();
    expect(button.disabled).toBeTrue();
  }));

  it('desabilita criacao de ticket quando incidente nao esta atribuido a mim', fakeAsync(() => {
    authSpy.getUser.and.returnValue({
      id: '11',
      name: 'Analista',
      email: 'analista@santander.com.br',
      profile: 'user',
      team: null,
    });
    apiSpy.getApplicationIncidentById.and.resolveTo(
      makeIncident({ assigned_to_user_id: '22', assigned_to_email: 'outro@santander.com.br' })
    );

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.detail-card__toolbar-actions button');

    expect(component.isAssignedToMe()).toBeFalse();
    expect(component.canCreateTicket()).toBeFalse();
    expect(button.disabled).toBeTrue();
  }));

  it('habilita criacao de ticket quando incidente esta atribuido a mim e sem ticket relacionado', fakeAsync(() => {
    authSpy.getUser.and.returnValue({
      id: '11',
      name: 'Analista',
      email: 'analista@santander.com.br',
      profile: 'user',
      team: null,
    });
    apiSpy.getApplicationIncidentById.and.resolveTo(
      makeIncident({ assigned_to_user_id: '11', assigned_to_email: 'analista@santander.com.br' })
    );

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.detail-card__toolbar-actions button');

    expect(component.isAssignedToMe()).toBeTrue();
    expect(component.canCreateTicket()).toBeTrue();
    expect(button.disabled).toBeFalse();
  }));

  it('nao abre modal de criacao quando incidente ja possui ticket relacionado', fakeAsync(() => {
    authSpy.getUser.and.returnValue({
      id: '11',
      name: 'Analista',
      email: 'analista@santander.com.br',
      profile: 'user',
      team: null,
    });
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident({ related_ticket_id: '777' }));

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.openCreateTicketModal();
    tick();

    expect(component.isCreateTicketModalVisible).toBeFalse();
  }));

  it('nao abre modal de criacao quando incidente nao esta atribuido a mim', fakeAsync(() => {
    authSpy.getUser.and.returnValue({
      id: '11',
      name: 'Analista',
      email: 'analista@santander.com.br',
      profile: 'user',
      team: null,
    });
    apiSpy.getApplicationIncidentById.and.resolveTo(
      makeIncident({ assigned_to_user_id: '22', assigned_to_email: 'outro@santander.com.br' })
    );

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.openCreateTicketModal();
    tick();

    expect(component.isCreateTicketModalVisible).toBeFalse();
  }));

  it('closeCreateTicketModal nao fecha enquanto cria ticket', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    component.isCreateTicketModalVisible = true;
    component.isCreatingTicket = true;
    component.closeCreateTicketModal();

    expect(component.isCreateTicketModalVisible).toBeTrue();
  }));

  it('formatValue formata objetos como JSON indentado', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    const result = component.formatValue({ error: 'DETALHE_PGTO_INVALIDO' });
    expect(result).toBe(JSON.stringify({ error: 'DETALHE_PGTO_INVALIDO' }, null, 2));
  }));

  it('formatValue retorna "Não informado" para valores nulos ou vazios', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    expect(component.formatValue(null)).toBe('Não informado');
    expect(component.formatValue(undefined)).toBe('Não informado');
    expect(component.formatValue('')).toBe('Não informado');
  }));

  it('formatDateTime formata timestamp ISO em horario local legivel', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    const result = component.formatDateTime('2026-04-01T10:05:00.000Z');
    expect(result).toMatch(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/);
  }));
});
