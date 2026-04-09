import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { OpenFinanceApiService } from './open-finance-api.service';
import { OpenFinanceTicketService, TicketListItem } from './open-finance-ticket.service';
import { TicketListFacadeService } from './ticket-list-facade.service';

function makeTicket(overrides: Partial<TicketListItem> = {}): TicketListItem {
  return {
    id: '1', title: 'Ticket', description: 'Desc', status: 'NOVO',
    type: 'Inc', ticketType: '1', template: '20',
    categoryNivel1: 'C', categoryNivel2: 'S', categoryNivel3: 'N3',
    assignmentGroup: 'G', requesterInstitution: '',
    criadoEm: '01-04-2026', criadoEmMs: 1000,
    atualizadoEm: '01-04-2026', atualizadoEmMs: 2000,
    flow: null,
    ...overrides,
  };
}

describe('TicketListFacadeService', () => {
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let ticketServiceSpy: jasmine.SpyObj<OpenFinanceTicketService>;
  let service: TicketListFacadeService;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', [
      'listTickets', 'listKnownTickets', 'listTicketStatuses',
    ]);
    ticketServiceSpy = jasmine.createSpyObj<OpenFinanceTicketService>('OpenFinanceTicketService', [
      'getTickets', 'hasFreshTickets', 'setTickets', 'mapTicketListPayload', 'mapKnownTicketListPayload', 'mergeTickets',
    ]);

    TestBed.configureTestingModule({
      providers: [
        TicketListFacadeService,
        { provide: OpenFinanceApiService, useValue: apiSpy },
        { provide: OpenFinanceTicketService, useValue: ticketServiceSpy },
      ],
    });

    service = TestBed.inject(TicketListFacadeService);
  });

  it('loadTickets busca da API, mescla com existentes e salva em cache', async () => {
    const existingTickets = [makeTicket({ id: '5' })];
    const syncedTickets   = [makeTicket({ id: '10' })];
    const merged          = [...existingTickets, ...syncedTickets];

    apiSpy.listTickets.and.resolveTo([] as never);
    ticketServiceSpy.mapTicketListPayload.and.returnValue(syncedTickets);
    ticketServiceSpy.mergeTickets.and.returnValue(merged);

    const result = await service.loadTickets({
      apiOwnerSlug: 'consentimentos-outbound',
      cacheOwnerSlug: 'consentimentos-outbound',
      existingTickets,
    });

    expect(apiSpy.listTickets).toHaveBeenCalledOnceWith('consentimentos-outbound');
    expect(ticketServiceSpy.mergeTickets).toHaveBeenCalledOnceWith(existingTickets, syncedTickets);
    expect(ticketServiceSpy.setTickets).toHaveBeenCalledOnceWith('consentimentos-outbound', merged);
    expect(result).toEqual(merged);
  });

  it('loadTickets aceita getter para capturar existingTickets após resolução da API', async () => {
    const existing = [makeTicket({ id: '5' })];
    ticketServiceSpy.mapTicketListPayload.and.returnValue([]);
    ticketServiceSpy.mergeTickets.and.returnValue(existing);
    apiSpy.listTickets.and.resolveTo([] as never);

    const getter = jasmine.createSpy('getter').and.returnValue(existing);
    await service.loadTickets({ cacheOwnerSlug: 'equipe-a', existingTickets: getter });

    expect(getter).toHaveBeenCalled();
    expect(ticketServiceSpy.mergeTickets).toHaveBeenCalledOnceWith(existing, []);
  });

  it('preloadKnownTickets não chama API quando ownerSlug está vazio', async () => {
    expect(await service.preloadKnownTickets('')).toEqual([]);
    expect(apiSpy.listKnownTickets).not.toHaveBeenCalled();
  });

  it('preloadKnownTickets salva tickets conhecidos em cache', async () => {
    const known = [makeTicket({ id: '3' })];
    apiSpy.listKnownTickets.and.resolveTo([] as never);
    ticketServiceSpy.mapKnownTicketListPayload.and.returnValue(known);

    await service.preloadKnownTickets('consentimentos-inbound');

    expect(ticketServiceSpy.setTickets).toHaveBeenCalledOnceWith('consentimentos-inbound', known);
  });

  describe('getLoadErrorMessage', () => {
    const casos: Array<[string, unknown, string]> = [
      ['401',        new HttpErrorResponse({ status: 401 }), 'Nao foi possivel renovar a sessao automaticamente na integracao Open Finance.'],
      ['503',        new HttpErrorResponse({ status: 503 }), 'Falha ao consultar tickets (503).'],
      ['Error',      new Error('Timeout'),                   'Timeout'],
      ['desconhecido', 'algo errado',                        'Nao foi possivel consultar tickets.'],
    ];

    casos.forEach(([label, err, expected]) => {
      it(`formata mensagem para erro ${label}`, () => {
        expect(service.getLoadErrorMessage(err)).toBe(expected);
      });
    });
  });
});
