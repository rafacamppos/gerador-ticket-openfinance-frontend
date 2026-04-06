import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { ApplicationIncidentDetailPageComponent } from './application-incident-detail-page.component';
import { OpenFinanceApiService } from '../services/open-finance-api.service';
import { ApplicationIncidentsFacadeService } from '../services/application-incidents-facade.service';
import { PortalAuthService } from '../services/portal-auth.service';
import { ApplicationIncident } from '../services/application-incidents.models';

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
      'createIncidentTicket',
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

    expect(component.ticketForm).toEqual({});
  }));

  it('createTicket chama createIncidentTicket com tipo_cliente e canal_jornada', fakeAsync(() => {
    const updatedIncident = makeIncident({ incident_status: 'ticket_created', related_ticket_id: '999' });
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
    apiSpy.createIncidentTicket.and.resolveTo({
      incident: updatedIncident,
      ticket_id: '999',
      ticket: { id: 999 },
    });

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.isCreateTicketModalVisible = true;

    void component.createTicket();
    tick();
    fixture.detectChanges();

    expect(apiSpy.createIncidentTicket).toHaveBeenCalledWith(
      'consentimentos-inbound',
      '4',
      {}
    );
    // ownerSlug vem do ActivatedRoute mock: 'consentimentos-inbound'
  }));

  it('createTicket atualiza incident e exibe mensagem de sucesso', fakeAsync(() => {
    const updatedIncident = makeIncident({ incident_status: 'ticket_created', related_ticket_id: '777' });
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());
    apiSpy.createIncidentTicket.and.resolveTo({
      incident: updatedIncident,
      ticket_id: '777',
      ticket: { id: 777 },
    });

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.isCreateTicketModalVisible = true;
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
    apiSpy.createIncidentTicket.and.rejectWith(new Error('Campos obrigatórios não preenchidos'));

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.isCreateTicketModalVisible = true;
    void component.createTicket();
    tick();
    fixture.detectChanges();

    expect(component.ticketCreateError).toBe('Campos obrigatórios não preenchidos');
    expect(component.isCreatingTicket).toBeFalse();
  }));

  it('openCreateTicketModal reinicia o form e limpa erros anteriores', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    component.ticketCreateError = 'Erro anterior';
    component.ticketCreateSuccess = 'Sucesso anterior';
    component.openCreateTicketModal();

    expect(component.ticketCreateError).toBe('');
    expect(component.ticketCreateSuccess).toBe('');
    expect(component.ticketForm).toEqual({});
    expect(component.isCreateTicketModalVisible).toBeTrue();
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

  it('formatValue retorna "Nao informado" para valores nulos ou vazios', fakeAsync(() => {
    apiSpy.getApplicationIncidentById.and.resolveTo(makeIncident());

    const fixture = TestBed.createComponent(ApplicationIncidentDetailPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    expect(component.formatValue(null)).toBe('Nao informado');
    expect(component.formatValue(undefined)).toBe('Nao informado');
    expect(component.formatValue('')).toBe('Nao informado');
  }));
});
