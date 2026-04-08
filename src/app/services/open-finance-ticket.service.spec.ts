import { TestBed } from '@angular/core/testing';

import { OpenFinanceTicketService } from './open-finance-ticket.service';

describe('OpenFinanceTicketService', () => {
  let service: OpenFinanceTicketService;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [OpenFinanceTicketService],
    });

    service = TestBed.inject(OpenFinanceTicketService);
  });

  it('guarda tickets em cache por equipe e respeita TTL', () => {
    spyOn(Date, 'now').and.returnValues(1000, 1500, 200000);

    service.setTickets('consentimentos-outbound', [
      {
        id: '1',
        title: 'Ticket 1',
        description: 'Descricao',
        status: 'NOVO',
        type: 'Incidente',
        ticketType: '1',
        template: '20',
        categoryNivel1: 'Categoria',
        categoryNivel2: 'Subcategoria',
        categoryNivel3: 'Nivel 3',
        assignmentGroup: 'N2_Santander',
        requesterInstitution: 'BCO SANTANDER (BRASIL) S.A.',
        criadoEm: '01-01-2026 10:00:00',
        criadoEmMs: 1,
        atualizadoEm: '01-01-2026 10:10:00',
        atualizadoEmMs: 2,
        flow: null,
      },
    ]);

    expect(service.getTickets('consentimentos-outbound').length).toBe(1);
    expect(service.hasFreshTickets('consentimentos-outbound')).toBeTrue();
    expect(service.hasFreshTickets('consentimentos-outbound')).toBeFalse();
  });

  it('mapeia payload da API e ordena pelos tickets mais recentes', () => {
    const mapped = service.mapTicketListPayload([
      {
        ticket: {
          id: '1',
          title: 'Mais antigo',
          status: 'NOVO',
          sr_type: 'Incidente',
          type: '1',
          template: '20',
          category: {
            nivel1: 'Cat',
            nivel2: 'Sub',
            nivel3: 'Nivel 3',
          },
          description: {
            summary: 'Descricao antiga',
          },
        },
        assignment: {
          grupo: 'N2_Santander',
          instituicao_requerente: 'Banco X',
        },
        timestamps: {
          criado_em: '2026-03-20T10:00:00',
          criado_em_ms: 100,
          atualizado_em: '2026-03-20T10:05:00',
          atualizado_em_ms: 110,
        },
      },
      {
        ticket: {
          id: '2',
          title: 'Mais recente',
          status: 'EM ATENDIMENTO N2',
          sr_type: 'Incidente',
          type: '1',
          template: '20',
          category: {
            nivel1: 'Cat',
            nivel2: 'Sub',
            nivel3: 'Nivel 3',
          },
          description: {
            summary: 'Descricao nova',
          },
        },
        assignment: {
          grupo: 'N2_Santander',
          instituicao_requerente: 'BCO SANTANDER (BRASIL) S.A.',
        },
        timestamps: {
          criado_em: '2026-03-21T10:00:00',
          criado_em_ms: 200,
          atualizado_em: '2026-03-21T10:10:00',
          atualizado_em_ms: 210,
        },
      },
    ]);

    expect(mapped.map((ticket) => ticket.id)).toEqual(['2', '1']);
    expect(service.isSantanderRequester('BCO SANTANDER (BRASIL) S.A.')).toBeTrue();
    expect(service.isSantanderRequester('Bco Santander (Brasil) S.A.')).toBeTrue();
    expect(service.isSantanderRequester('Banco X')).toBeFalse();
  });

  it('mapeia payload de tickets conhecidos para renderizacao inicial da lista', () => {
    const mapped = service.mapKnownTicketListPayload([
      {
        ticket_id: '9',
        ticket_title: 'Ticket conhecido',
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

    expect(mapped).toEqual([
      jasmine.objectContaining({
        id: '9',
        title: 'Ticket conhecido',
        status: 'EM ATENDIMENTO N2',
        description: 'Dados locais conhecidos. Atualizando detalhes...',
        flow: jasmine.objectContaining({
          current_stage: 'accepted_by_owner',
          current_stage_label: 'Aceito pela equipe',
        }),
      }),
    ]);
  });

  it('mergeTickets mescla listas deduplicando pelo id, synced tem prioridade', () => {
    const existing = [
      {
        id: '1', title: 'Antigo', description: 'Desc', status: 'NOVO', type: 'Inc',
        ticketType: '1', template: '20', categoryNivel1: 'Cat', categoryNivel2: 'Sub',
        categoryNivel3: 'N3', assignmentGroup: 'G', requesterInstitution: '',
        criadoEm: '01-01-2026 10:00:00', criadoEmMs: 100,
        atualizadoEm: '01-01-2026 10:00:00', atualizadoEmMs: 100,
        flow: null,
      },
      {
        id: '2', title: 'Somente existente', description: 'Desc', status: 'NOVO', type: 'Inc',
        ticketType: '1', template: '20', categoryNivel1: 'Cat', categoryNivel2: 'Sub',
        categoryNivel3: 'N3', assignmentGroup: 'G', requesterInstitution: '',
        criadoEm: '01-01-2026 09:00:00', criadoEmMs: 50,
        atualizadoEm: '01-01-2026 09:00:00', atualizadoEmMs: 50,
        flow: null,
      },
    ];

    const synced = [
      {
        id: '1', title: 'Atualizado', description: 'Nova desc', status: 'EM ATENDIMENTO', type: 'Inc',
        ticketType: '1', template: '20', categoryNivel1: 'Cat', categoryNivel2: 'Sub',
        categoryNivel3: 'N3', assignmentGroup: 'G', requesterInstitution: '',
        criadoEm: '01-01-2026 10:00:00', criadoEmMs: 100,
        atualizadoEm: '01-01-2026 11:00:00', atualizadoEmMs: 200,
        flow: null,
      },
      {
        id: '3', title: 'Apenas synced', description: 'Desc', status: 'NOVO', type: 'Inc',
        ticketType: '1', template: '20', categoryNivel1: 'Cat', categoryNivel2: 'Sub',
        categoryNivel3: 'N3', assignmentGroup: 'G', requesterInstitution: '',
        criadoEm: '01-01-2026 12:00:00', criadoEmMs: 300,
        atualizadoEm: '01-01-2026 12:00:00', atualizadoEmMs: 300,
        flow: null,
      },
    ];

    const merged = service.mergeTickets(existing, synced);

    expect(merged.map((t) => t.id)).toEqual(['3', '1', '2']);
    expect(merged.find((t) => t.id === '1')?.title).toBe('Atualizado');
    expect(merged.find((t) => t.id === '2')?.title).toBe('Somente existente');
    expect(merged.find((t) => t.id === '3')?.title).toBe('Apenas synced');
  });

  it('mergeTickets ignora tickets sem id', () => {
    const existing = [
      { id: '', title: 'Sem id', description: '', status: '', type: '', ticketType: '',
        template: '', categoryNivel1: '', categoryNivel2: '', categoryNivel3: '',
        assignmentGroup: '', requesterInstitution: '', criadoEm: '', criadoEmMs: 0,
        atualizadoEm: '', atualizadoEmMs: 0, flow: null },
    ];

    const merged = service.mergeTickets(existing, []);
    expect(merged.length).toBe(0);
  });

  it('clearCache remove todos os tickets da memoria e do sessionStorage', () => {
    service.setTickets('equipe-a', [
      {
        id: '1', title: 'T', description: 'D', status: 'S', type: 'I',
        ticketType: '1', template: '20', categoryNivel1: 'C', categoryNivel2: 'S',
        categoryNivel3: 'N', assignmentGroup: 'G', requesterInstitution: '',
        criadoEm: '01-01-2026 10:00:00', criadoEmMs: 1,
        atualizadoEm: '01-01-2026 10:00:00', atualizadoEmMs: 1,
        flow: null,
      },
    ]);

    expect(service.getTickets('equipe-a').length).toBe(1);

    service.clearCache();

    expect(service.getTickets('equipe-a').length).toBe(0);
    expect(sessionStorage.getItem('open-finance-ticket-list-v3')).toBeNull();
  });

  it('mapTicketListPayload retorna array vazio para payload invalido', () => {
    expect(service.mapTicketListPayload(null)).toEqual([]);
    expect(service.mapTicketListPayload('string')).toEqual([]);
    expect(service.mapTicketListPayload(undefined)).toEqual([]);
    expect(service.mapTicketListPayload(42)).toEqual([]);
  });

  it('mapKnownTicketListPayload retorna array vazio para payload invalido', () => {
    expect(service.mapKnownTicketListPayload(null)).toEqual([]);
    expect(service.mapKnownTicketListPayload({})).toEqual([]);
  });
});
