import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { TicketOwnerPageComponent } from './ticket-owner-page.component';
import { OpenFinanceApiService } from '../services/open-finance-api.service';
import { OpenFinanceTicketService } from '../services/open-finance-ticket.service';

describe('TicketOwnerPageComponent', () => {
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let ticketService: OpenFinanceTicketService;

  const apiPayload = [
    {
      ticket: {
        id: '1',
        title: 'Ticket Santander',
        status: 'EM ATENDIMENTO N2',
        sr_type: 'Incidente',
        type: '1',
        template: '20',
        category: {
          nivel1: 'Erro na Jornada ou Dados',
          nivel2: 'Obtendo um Consentimento',
          nivel3: 'Redirecionamento para Conclusao',
        },
        description: {
          summary: 'Descricao 1',
        },
      },
      assignment: {
        grupo: 'N2_Santander',
        instituicao_requerente: 'BCO SANTANDER (BRASIL) S.A.',
      },
      timestamps: {
        criado_em: '2026-03-21T10:00:00',
        criado_em_ms: 100,
        atualizado_em: '2026-03-21T10:10:00',
        atualizado_em_ms: 110,
      },
    },
    {
      ticket: {
        id: '2',
        title: 'Ticket Banco X',
        status: 'NOVO',
        sr_type: 'Incidente',
        type: '1',
        template: '20',
        category: {
          nivel1: 'Erro na Jornada ou Dados',
          nivel2: 'Obtendo um Consentimento',
          nivel3: 'Redirecionamento para Conclusao',
        },
        description: {
          summary: 'Descricao 2',
        },
      },
      assignment: {
        grupo: 'N2_Santander',
        instituicao_requerente: 'Banco X',
      },
      timestamps: {
        criado_em: '2026-03-20T10:00:00',
        criado_em_ms: 90,
        atualizado_em: '2026-03-20T10:05:00',
        atualizado_em_ms: 95,
      },
    },
  ];

  beforeEach(async () => {
    sessionStorage.clear();

    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', [
      'listTickets',
      'listKnownTickets',
    ]);

    await TestBed.configureTestingModule({
      imports: [TicketOwnerPageComponent],
      providers: [
        provideRouter([]),
        OpenFinanceTicketService,
        { provide: OpenFinanceApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                ownerSlug: 'consentimentos-outbound',
              }),
            },
          },
        },
      ],
    }).compileComponents();

    ticketService = TestBed.inject(OpenFinanceTicketService);
  });

  function createDeferredPromise<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((innerResolve, innerReject) => {
      resolve = innerResolve;
      reject = innerReject;
    });

    return { promise, resolve, reject };
  }

  it('carrega tickets da API e salva em cache por equipe', fakeAsync(() => {
    apiSpy.listKnownTickets.and.resolveTo([]);
    apiSpy.listTickets.and.resolveTo(apiPayload);

    const fixture = TestBed.createComponent(TicketOwnerPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(apiSpy.listTickets).toHaveBeenCalledOnceWith('consentimentos-outbound');
    expect(component.tickets.length).toBe(2);
    expect(ticketService.getTickets('consentimentos-outbound').length).toBe(2);
  }));

  it('mantem cache visivel ao entrar e sincroniza em background a cada 5 minutos', fakeAsync(() => {
    const mappedTickets = ticketService.mapTicketListPayload(apiPayload);
    spyOn(Date, 'now').and.returnValues(1000, 1000, 2000, 2000);
    ticketService.setTickets('consentimentos-outbound', mappedTickets);
    apiSpy.listKnownTickets.and.resolveTo([]);
    apiSpy.listTickets.and.resolveTo(apiPayload);

    const fixture = TestBed.createComponent(TicketOwnerPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(apiSpy.listTickets).toHaveBeenCalledOnceWith('consentimentos-outbound');
    expect(apiSpy.listKnownTickets).not.toHaveBeenCalled();
    expect(component.tickets.length).toBe(2);

    tick(300000);
    tick();
    fixture.detectChanges();

    expect(apiSpy.listTickets).toHaveBeenCalledTimes(2);
  }));

  it('exibe tickets locais enquanto aguarda a sincronizacao externa', fakeAsync(() => {
    const knownTicketsDeferred = createDeferredPromise<any[]>();
    const apiTicketsDeferred = createDeferredPromise<any[]>();

    apiSpy.listKnownTickets.and.returnValue(knownTicketsDeferred.promise);
    apiSpy.listTickets.and.returnValue(apiTicketsDeferred.promise);

    const fixture = TestBed.createComponent(TicketOwnerPageComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();
    tick();

    expect(apiSpy.listKnownTickets).toHaveBeenCalledOnceWith('consentimentos-outbound');
    expect(apiSpy.listTickets).toHaveBeenCalledOnceWith('consentimentos-outbound');
    expect(component.tickets.length).toBe(0);

    knownTicketsDeferred.resolve([
      {
        ticket_id: '9',
        ticket_title: 'Ticket local conhecido',
        ticket_status: 'EM ATENDIMENTO N2',
        current_stage: 'accepted_by_owner',
        current_stage_label: 'Aceito pela equipe',
        current_owner_slug: 'consentimentos-outbound',
        current_owner_name: 'Consentimentos Outbound',
        assigned_owner_slug: 'consentimentos-outbound',
        assigned_owner_name: 'Consentimentos Outbound',
        accepted_by_team: true,
        responded_by_team: false,
        returned_to_su: false,
        last_actor_name: null,
        last_actor_email: null,
        last_action: null,
        last_action_label: null,
        created_at: '2026-03-22T10:00:00',
        updated_at: '2026-03-22T10:05:00',
      },
    ]);
    tick();
    fixture.detectChanges();

    expect(component.tickets[0].id).toBe('9');

    apiTicketsDeferred.resolve(apiPayload);
    tick();
    fixture.detectChanges();

    expect(component.tickets[0].id).toBe('1');
    expect(component.tickets.length).toBe(3);
    expect(component.tickets.some((ticket: any) => ticket.id === '9')).toBeTrue();
  }));
});
