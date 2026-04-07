import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { OpenFinanceApiService, TicketStatusOption } from './open-finance-api.service';
import { OpenFinanceTicketService, TicketListItem } from './open-finance-ticket.service';
import { TicketListFacadeService } from './ticket-list-facade.service';

function makeTicketItem(overrides: Partial<TicketListItem> = {}): TicketListItem {
  return {
    id: '1',
    title: 'Ticket',
    description: 'Descricao',
    status: 'NOVO',
    type: 'Incidente',
    ticketType: '1',
    template: '20',
    categoryNivel1: 'Cat',
    categoryNivel2: 'Sub',
    categoryNivel3: 'Nivel 3',
    assignmentGroup: 'N2',
    requesterInstitution: 'Banco X',
    criadoEm: '01-04-2026 10:00:00',
    criadoEmMs: 1000,
    atualizadoEm: '01-04-2026 10:10:00',
    atualizadoEmMs: 2000,
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
      'listTickets',
      'listKnownTickets',
      'listTicketStatuses',
    ]);
    ticketServiceSpy = jasmine.createSpyObj<OpenFinanceTicketService>('OpenFinanceTicketService', [
      'getTickets',
      'hasFreshTickets',
      'setTickets',
      'mapTicketListPayload',
      'mapKnownTicketListPayload',
      'mergeTickets',
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

  describe('getCachedTickets', () => {
    it('delega para ticketService.getTickets', () => {
      const tickets = [makeTicketItem()];
      ticketServiceSpy.getTickets.and.returnValue(tickets);

      const result = service.getCachedTickets('consentimentos-outbound');

      expect(ticketServiceSpy.getTickets).toHaveBeenCalledOnceWith('consentimentos-outbound');
      expect(result).toEqual(tickets);
    });
  });

  describe('hasFreshTickets', () => {
    it('delega para ticketService.hasFreshTickets', () => {
      ticketServiceSpy.hasFreshTickets.and.returnValue(true);

      const result = service.hasFreshTickets('iniciadora-pagamentos');

      expect(ticketServiceSpy.hasFreshTickets).toHaveBeenCalledOnceWith('iniciadora-pagamentos');
      expect(result).toBeTrue();
    });
  });

  describe('setCachedTickets', () => {
    it('delega para ticketService.setTickets', () => {
      const tickets = [makeTicketItem()];

      service.setCachedTickets('detentora-pagamentos', tickets);

      expect(ticketServiceSpy.setTickets).toHaveBeenCalledOnceWith('detentora-pagamentos', tickets);
    });
  });

  describe('loadTickets', () => {
    it('carrega tickets da API, mapeia, mescla e armazena em cache', async () => {
      const rawPayload = [{}];
      const mappedTickets = [makeTicketItem({ id: '10' })];
      const existingTickets = [makeTicketItem({ id: '5' })];
      const mergedTickets = [...existingTickets, ...mappedTickets];

      apiSpy.listTickets.and.resolveTo(rawPayload as never);
      ticketServiceSpy.mapTicketListPayload.and.returnValue(mappedTickets);
      ticketServiceSpy.mergeTickets.and.returnValue(mergedTickets);

      const result = await service.loadTickets({
        apiOwnerSlug: 'consentimentos-outbound',
        cacheOwnerSlug: 'consentimentos-outbound',
        existingTickets,
      });

      expect(apiSpy.listTickets).toHaveBeenCalledOnceWith('consentimentos-outbound');
      expect(ticketServiceSpy.mapTicketListPayload).toHaveBeenCalledOnceWith(rawPayload);
      expect(ticketServiceSpy.mergeTickets).toHaveBeenCalledOnceWith(existingTickets, mappedTickets);
      expect(ticketServiceSpy.setTickets).toHaveBeenCalledOnceWith('consentimentos-outbound', mergedTickets);
      expect(result).toEqual(mergedTickets);
    });

    it('usa array vazio quando existingTickets nao e informado', async () => {
      const mappedTickets: TicketListItem[] = [];
      apiSpy.listTickets.and.resolveTo([] as never);
      ticketServiceSpy.mapTicketListPayload.and.returnValue(mappedTickets);
      ticketServiceSpy.mergeTickets.and.returnValue([]);

      await service.loadTickets({ cacheOwnerSlug: 'servicos-outbound' });

      expect(ticketServiceSpy.mergeTickets).toHaveBeenCalledOnceWith([], mappedTickets);
    });

    it('aceita existingTickets como getter avaliado apos a chamada a API', async () => {
      const existingTickets = [makeTicketItem({ id: '5' })];
      const mappedTickets = [makeTicketItem({ id: '10' })];
      const mergedTickets = [...existingTickets, ...mappedTickets];

      apiSpy.listTickets.and.resolveTo([] as never);
      ticketServiceSpy.mapTicketListPayload.and.returnValue(mappedTickets);
      ticketServiceSpy.mergeTickets.and.returnValue(mergedTickets);

      const getter = jasmine.createSpy('getter').and.returnValue(existingTickets);

      const result = await service.loadTickets({
        cacheOwnerSlug: 'consentimentos-outbound',
        existingTickets: getter,
      });

      expect(getter).toHaveBeenCalled();
      expect(ticketServiceSpy.mergeTickets).toHaveBeenCalledOnceWith(existingTickets, mappedTickets);
      expect(result).toEqual(mergedTickets);
    });
  });

  describe('loadKnownTickets', () => {
    it('carrega tickets conhecidos da API e mapeia', async () => {
      const rawPayload = [{}];
      const knownTickets = [makeTicketItem({ id: '7' })];

      apiSpy.listKnownTickets.and.resolveTo(rawPayload as never);
      ticketServiceSpy.mapKnownTicketListPayload.and.returnValue(knownTickets);

      const result = await service.loadKnownTickets('compartilhamento-dados-maq-captura');

      expect(apiSpy.listKnownTickets).toHaveBeenCalledOnceWith('compartilhamento-dados-maq-captura');
      expect(ticketServiceSpy.mapKnownTicketListPayload).toHaveBeenCalledOnceWith(rawPayload);
      expect(result).toEqual(knownTickets);
    });
  });

  describe('preloadKnownTickets', () => {
    it('retorna array vazio quando ownerSlug esta vazio', async () => {
      const result = await service.preloadKnownTickets('');

      expect(apiSpy.listKnownTickets).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('carrega e armazena tickets conhecidos em cache quando ownerSlug e informado', async () => {
      const knownTickets = [makeTicketItem({ id: '3' })];
      apiSpy.listKnownTickets.and.resolveTo([] as never);
      ticketServiceSpy.mapKnownTicketListPayload.and.returnValue(knownTickets);

      const result = await service.preloadKnownTickets('consentimentos-inbound');

      expect(ticketServiceSpy.setTickets).toHaveBeenCalledOnceWith('consentimentos-inbound', knownTickets);
      expect(result).toEqual(knownTickets);
    });
  });

  describe('loadTicketStatuses', () => {
    it('delega para openFinanceApi.listTicketStatuses', async () => {
      const statuses: TicketStatusOption[] = [{ id: '1', name: 'Novo' }];
      apiSpy.listTicketStatuses.and.resolveTo(statuses);

      const result = await service.loadTicketStatuses();

      expect(apiSpy.listTicketStatuses).toHaveBeenCalled();
      expect(result).toEqual(statuses);
    });
  });

  describe('getLoadErrorMessage', () => {
    it('retorna mensagem de sessao para erro 401', () => {
      const error = new HttpErrorResponse({ status: 401 });
      expect(service.getLoadErrorMessage(error)).toBe(
        'Nao foi possivel renovar a sessao automaticamente na integracao Open Finance.'
      );
    });

    it('retorna mensagem com status para outros erros HTTP', () => {
      const error = new HttpErrorResponse({ status: 503 });
      expect(service.getLoadErrorMessage(error)).toBe('Falha ao consultar tickets (503).');
    });

    it('retorna mensagem do Error', () => {
      const error = new Error('Timeout');
      expect(service.getLoadErrorMessage(error)).toBe('Timeout');
    });

    it('retorna mensagem generica para erros desconhecidos', () => {
      expect(service.getLoadErrorMessage('algo errado')).toBe('Nao foi possivel consultar tickets.');
    });
  });
});
