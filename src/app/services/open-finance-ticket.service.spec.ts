import { TestBed } from '@angular/core/testing';

import { OpenFinanceTicketService, TicketListItem } from './open-finance-ticket.service';

function makeTicket(overrides: Partial<TicketListItem> = {}): TicketListItem {
  return {
    id: '1', title: 'Ticket', description: 'Desc', status: 'NOVO',
    type: 'Incidente', ticketType: '1', template: '20',
    categoryNivel1: 'Cat', categoryNivel2: 'Sub', categoryNivel3: 'N3',
    assignmentGroup: 'N2_Santander', requesterInstitution: '',
    criadoEm: '01-01-2026 10:00:00', criadoEmMs: 100,
    atualizadoEm: '01-01-2026 10:00:00', atualizadoEmMs: 100,
    flow: null,
    ...overrides,
  };
}

describe('OpenFinanceTicketService', () => {
  let service: OpenFinanceTicketService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [OpenFinanceTicketService] });
    service = TestBed.inject(OpenFinanceTicketService);
  });

  describe('cache', () => {
    it('armazena tickets por equipe e respeita TTL de 2 minutos', () => {
      spyOn(Date, 'now').and.returnValues(1000, 1500, 200000);
      service.setTickets('equipe-a', [makeTicket()]);
      expect(service.hasFreshTickets('equipe-a')).toBeTrue();
      expect(service.hasFreshTickets('equipe-a')).toBeFalse();
    });

    it('clearCache remove tickets da memória e do sessionStorage', () => {
      service.setTickets('equipe-a', [makeTicket()]);
      service.clearCache();
      expect(service.getTickets('equipe-a')).toEqual([]);
      expect(sessionStorage.getItem('open-finance-ticket-list-v3')).toBeNull();
    });
  });

  describe('mapTicketListPayload', () => {
    it('mapeia e ordena pelo ticket mais recente primeiro', () => {
      const payload = [
        {
          ticket: { id: '1', title: 'Antigo', status: 'NOVO', description: { summary: 'D' } },
          assignment: { grupo: 'G', instituicao_requerente: 'Banco X' },
          timestamps: { criado_em_ms: 100, atualizado_em_ms: 110 },
        },
        {
          ticket: { id: '2', title: 'Recente', status: 'EM ATENDIMENTO', description: { summary: 'D' },
            category: { nivel1: 'C', nivel2: 'S', nivel3: 'N' } },
          assignment: { grupo: 'G', instituicao_requerente: 'BCO SANTANDER (BRASIL) S.A.' },
          timestamps: { criado_em_ms: 200, atualizado_em_ms: 210 },
        },
      ];

      const mapped = service.mapTicketListPayload(payload);

      expect(mapped.map(t => t.id)).toEqual(['2', '1']);
      expect(service.isSantanderRequester('BCO SANTANDER (BRASIL) S.A.')).toBeTrue();
      expect(service.isSantanderRequester('Bco Santander (Brasil) S.A.')).toBeTrue();
      expect(service.isSantanderRequester('Banco X')).toBeFalse();
    });

    it('retorna array vazio para payload inválido', () => {
      expect(service.mapTicketListPayload(null)).toEqual([]);
      expect(service.mapTicketListPayload('string')).toEqual([]);
    });
  });

  describe('mapKnownTicketListPayload', () => {
    it('gera lista de tickets a partir do estado de fluxo local', () => {
      const mapped = service.mapKnownTicketListPayload([{
        ticket_id: '9', ticket_title: 'Ticket local', ticket_status: 'EM ATENDIMENTO N2',
        current_stage: 'accepted_by_owner', current_stage_label: 'Aceito',
        current_owner_slug: 'consentimentos-outbound', current_owner_name: 'CO',
        assigned_owner_slug: 'consentimentos-outbound', assigned_owner_name: 'CO',
        accepted_by_team: true, responded_by_team: false, returned_to_su: false,
        last_actor_name: null, last_actor_email: null, last_action: null, last_action_label: null,
        created_at: '2026-03-22T10:00:00', updated_at: '2026-03-22T10:05:00',
      }]);

      expect(mapped[0]).toEqual(jasmine.objectContaining({
        id: '9', title: 'Ticket local', status: 'EM ATENDIMENTO N2',
        description: 'Dados locais conhecidos. Atualizando detalhes...',
        flow: jasmine.objectContaining({ current_stage: 'accepted_by_owner' }),
      }));
    });

    it('retorna array vazio para payload inválido', () => {
      expect(service.mapKnownTicketListPayload(null)).toEqual([]);
      expect(service.mapKnownTicketListPayload({})).toEqual([]);
    });
  });

  describe('mergeTickets', () => {
    it('mescla listas dando prioridade aos tickets sincronizados', () => {
      const existing  = [makeTicket({ id: '1', title: 'Antigo', atualizadoEmMs: 100 }),
                         makeTicket({ id: '2', title: 'Somente existente', atualizadoEmMs: 50 })];
      const synced    = [makeTicket({ id: '1', title: 'Atualizado', atualizadoEmMs: 200 }),
                         makeTicket({ id: '3', title: 'Apenas sync', atualizadoEmMs: 300 })];

      const merged = service.mergeTickets(existing, synced);

      expect(merged.map(t => t.id)).toEqual(['3', '1', '2']);
      expect(merged.find(t => t.id === '1')?.title).toBe('Atualizado');
    });

    it('descarta tickets sem id', () => {
      expect(service.mergeTickets([makeTicket({ id: '' })], [])).toEqual([]);
    });
  });
});
