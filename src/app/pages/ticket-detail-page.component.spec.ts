import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { TicketDetailPageComponent } from './ticket-detail-page.component';
import { OpenFinanceApiService, TicketFlowResponse } from '../services/open-finance-api.service';
import { OpenFinanceTicketService } from '../services/open-finance-ticket.service';
import { ToastService } from '../services/toast.service';
import { TicketFlowState } from '../services/open-finance-flow.models';

type Comp = TicketDetailPageComponent & {
  isLoading: boolean; errorMessage: string; ticket: unknown; flow: unknown;
  isSubmittingFlow: boolean; flowErrorMessage: string; flowSuccessMessage: string;
  isFlowHistoryVisible: boolean; isRouteFormVisible: boolean;
  selectedRouteOwnerSlug: string; flowNote: string;
  statusBadgeClass(s: unknown): string;
  formatValue(v: unknown): string;
  isSectionOpen(k: string): boolean;
  toggleSection(k: string): void;
  toggleFlowHistory(): void;
  flowStageLabel(l: string | null | undefined): string;
  flowActionLabel(l: string | null | undefined): string;
  canRouteToOwner(): boolean; canAccept(): boolean;
  canRespond(): boolean; canReturnToSu(): boolean; canReject(): boolean;
  goBack(): void;
  routeToResponsibleOwner(): Promise<void>;
  acceptTicket(): Promise<void>;
  respondTicket(): Promise<void>;
  rejectTicket(): Promise<void>;
};

function makeFlow(overrides: Partial<TicketFlowState> = {}): TicketFlowResponse {
  return {
    state: {
      ticket_id: '42', ticket_title: 'Ticket', ticket_status: 'EM ATENDIMENTO N2',
      current_stage: 'routed_to_owner', current_stage_label: 'Direcionado',
      current_owner_slug: 'consentimentos-outbound', current_owner_name: 'CO',
      assigned_owner_slug: 'consentimentos-outbound', assigned_owner_name: 'CO',
      accepted_by_team: false, responded_by_team: false, returned_to_su: false,
      last_actor_name: null, last_actor_email: null, last_action: null, last_action_label: null,
      created_at: '2026-04-01T10:00:00', updated_at: '2026-04-01T10:05:00',
      ...overrides,
    },
    events: [],
  };
}

function makeTicket(routingSlug = 'consentimentos-outbound'): Record<string, unknown> {
  return {
    ticket: { id: '42', title: 'Ticket', status: 'EM ATENDIMENTO N2',
      description: { summary: 'Desc' }, category: { nivel1: 'C', nivel2: 'S', nivel3: 'N' } },
    routing: { owner_slug: routingSlug, owner_name: 'CO' },
    assignment: { grupo: 'G', instituicao_requerente: 'Banco X' },
    timestamps: { criado_em_ms: 1000, atualizado_em_ms: 2000 },
    flow: makeFlow().state,
  };
}

describe('TicketDetailPageComponent', () => {
  let fixture: ComponentFixture<TicketDetailPageComponent>;
  let c: Comp;
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let ticketServiceSpy: jasmine.SpyObj<OpenFinanceTicketService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let locationSpy: jasmine.SpyObj<Location>;

  function setup(ticketId: string | null, ownerSlug = '') {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          paramMap:      convertToParamMap(ticketId ? { ticketId } : {}),
          queryParamMap: convertToParamMap(ownerSlug ? { ownerSlug } : {}),
        },
      },
    });
  }

  function create(): void {
    fixture = TestBed.createComponent(TicketDetailPageComponent);
    c = fixture.componentInstance as unknown as Comp;
  }

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService',
      ['getTicketById', 'getTicketFlow', 'transitionTicketFlow']);
    ticketServiceSpy = jasmine.createSpyObj<OpenFinanceTicketService>('OpenFinanceTicketService', ['clearCache']);
    toastServiceSpy  = jasmine.createSpyObj<ToastService>('ToastService', ['success']);
    locationSpy      = jasmine.createSpyObj<Location>('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [TicketDetailPageComponent],
      providers: [
        provideRouter([]),
        { provide: OpenFinanceApiService,    useValue: apiSpy },
        { provide: OpenFinanceTicketService, useValue: ticketServiceSpy },
        { provide: ToastService,             useValue: toastServiceSpy },
        { provide: Location,                 useValue: locationSpy },
        { provide: ActivatedRoute, useValue: {
            snapshot: {
              paramMap:      convertToParamMap({ ticketId: '42' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();
  });

  describe('carregamento inicial', () => {
    it('carrega ticket e fluxo ao inicializar', fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicket() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlow());
      create(); fixture.detectChanges(); tick();

      expect(c.ticket).toBeTruthy();
      expect(c.flow).toBeTruthy();
      expect(c.isLoading).toBeFalse();
    }));

    it('exibe erro quando ticketId não está na rota', fakeAsync(() => {
      setup(null); create(); fixture.detectChanges(); tick();

      expect(c.errorMessage).toBe('Ticket não informado.');
      expect(apiSpy.getTicketById).not.toHaveBeenCalled();
    }));

    const errosCarga: Array<[string, HttpErrorResponse | Error, string]> = [
      ['401', new HttpErrorResponse({ status: 401 }), 'Nao foi possivel renovar a sessao automaticamente na integracao Open Finance.'],
      ['404', new HttpErrorResponse({ status: 404 }), 'Falha ao carregar ticket (404).'],
      ['Error', new Error('Timeout'),                  'Timeout'],
    ];

    errosCarga.forEach(([label, err, expected]) => {
      it(`exibe mensagem para erro ${label}`, fakeAsync(() => {
        apiSpy.getTicketById.and.rejectWith(err);
        apiSpy.getTicketFlow.and.rejectWith(err);
        create(); fixture.detectChanges(); tick();
        expect(c.errorMessage).toBe(expected);
      }));
    });
  });

  describe('statusBadgeClass', () => {
    const casos: Array<[string, string]> = [
      ['NOVO',       'ticket-detail__status--open'],
      ['Aberto',     'ticket-detail__status--open'],
      ['Em andamento','ticket-detail__status--in-progress'],
      ['Aguardando', 'ticket-detail__status--waiting'],
      ['Resolvido',  'ticket-detail__status--resolved'],
      ['Fechado',    'ticket-detail__status--closed'],
      ['Cancelado',  'ticket-detail__status--cancelled'],
      ['Outro',      ''],
    ];

    beforeEach(fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicket() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlow());
      create(); fixture.detectChanges(); tick();
    }));

    casos.forEach(([status, cssClass]) => {
      it(`"${status}" → "${cssClass}"`, () => {
        expect(c.statusBadgeClass(status)).toBe(cssClass);
      });
    });
  });

  describe('formatValue', () => {
    beforeEach(fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicket() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlow());
      create(); fixture.detectChanges(); tick();
    }));

    it('retorna "Nao informado" para null, undefined e string vazia', () => {
      expect(c.formatValue(null)).toBe('Nao informado');
      expect(c.formatValue(undefined)).toBe('Nao informado');
      expect(c.formatValue('')).toBe('Nao informado');
    });

    it('serializa booleans e objetos corretamente', () => {
      expect(c.formatValue(true)).toBe('Sim');
      expect(c.formatValue(false)).toBe('Nao');
      expect(c.formatValue({ k: 1 })).toBe('{\n  "k": 1\n}');
    });
  });

  describe('seções recolhíveis', () => {
    beforeEach(fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicket() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlow());
      create(); fixture.detectChanges(); tick();
    }));

    it('seções com lógica ficam fechadas por padrão; toggleSection abre e fecha', () => {
      expect(c.isSectionOpen('contexto-api')).toBeFalse();
      c.toggleSection('contexto-api');
      expect(c.isSectionOpen('contexto-api')).toBeTrue();
      c.toggleSection('contexto-api');
      expect(c.isSectionOpen('contexto-api')).toBeFalse();
    });
  });

  describe('transições de fluxo', () => {
    beforeEach(fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicket() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlow({ current_stage: 'routed_to_owner', current_owner_slug: 'consentimentos-outbound' }));
      setup('42', 'consentimentos-outbound');
      create(); fixture.detectChanges(); tick();
    }));

    it('acceptTicket atualiza fluxo, exibe toast e limpa cache', fakeAsync(() => {
      const updated = makeFlow({ current_stage: 'accepted_by_owner' });
      apiSpy.transitionTicketFlow.and.resolveTo(updated);

      c.acceptTicket(); tick();

      expect(apiSpy.transitionTicketFlow).toHaveBeenCalledOnceWith('42', jasmine.objectContaining({ action: 'accept' }));
      expect(toastServiceSpy.success).toHaveBeenCalled();
      expect(ticketServiceSpy.clearCache).toHaveBeenCalled();
    }));

    it('exibe erro quando transição falha', fakeAsync(() => {
      apiSpy.transitionTicketFlow.and.rejectWith(new HttpErrorResponse({ status: 422 }));
      c.acceptTicket(); tick();
      expect(c.flowErrorMessage).toBe('Falha ao atualizar fluxo (422).');
    }));
  });

  describe('permissões de ação (canXxx)', () => {
    const permissoes: Array<[string, string, string, string, boolean]> = [
      ['canRouteToOwner', 'su-super-usuarios',      'triage_su',         'su-super-usuarios',      true],
      ['canAccept',       'iniciadora-pagamentos',  'routed_to_owner',   'iniciadora-pagamentos',  true],
      ['canRespond',      'detentora-pagamentos',   'accepted_by_owner', 'detentora-pagamentos',   true],
      ['canReject',       'servicos-outbound',      'accepted_by_owner', 'servicos-outbound',      true],
    ];

    permissoes.forEach(([metodo, ownerQuery, stage, currentOwner, expected]) => {
      it(`${metodo} retorna ${expected} para stage="${stage}" e owner="${ownerQuery}"`, fakeAsync(() => {
        apiSpy.getTicketById.and.resolveTo(makeTicket() as never);
        apiSpy.getTicketFlow.and.resolveTo(makeFlow({ current_stage: stage, current_owner_slug: currentOwner }));
        setup('42', ownerQuery);
        create(); fixture.detectChanges(); tick();

        expect((c[metodo as keyof Comp] as () => boolean)()).toBe(expected);
      }));
    });
  });

  describe('routeToResponsibleOwner', () => {
    beforeEach(fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicket() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlow({ current_stage: 'triage_su' }));
      setup('42', 'su-super-usuarios');
      create(); fixture.detectChanges(); tick();
    }));

    it('exibe erro quando nenhuma equipe está selecionada', fakeAsync(() => {
      c.selectedRouteOwnerSlug = '';
      c.routeToResponsibleOwner(); tick();
      expect(c.flowErrorMessage).toBe('Selecione a equipe responsavel antes de direcionar o ticket.');
      expect(apiSpy.transitionTicketFlow).not.toHaveBeenCalled();
    }));

    it('direciona para o owner selecionado com a ação correta', fakeAsync(() => {
      c.selectedRouteOwnerSlug = 'consentimentos-inbound';
      apiSpy.transitionTicketFlow.and.resolveTo(makeFlow());
      c.routeToResponsibleOwner(); tick();
      expect(apiSpy.transitionTicketFlow).toHaveBeenCalledOnceWith('42',
        jasmine.objectContaining({ action: 'route_to_owner', targetOwnerSlug: 'consentimentos-inbound' }));
    }));
  });

  describe('navegação', () => {
    it('navega para a área do owner quando ownerSlug está na query', fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicket() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlow());
      setup('42', 'consentimentos-outbound');
      create(); fixture.detectChanges(); tick();

      spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      c.goBack();
      expect(TestBed.inject(Router).navigate).toHaveBeenCalledOnceWith(['/areas', 'consentimentos-outbound'] as never);
    }));

    it('chama location.back() sem ownerSlug na query', fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicket() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlow());
      setup('42'); create(); fixture.detectChanges(); tick();
      c.goBack();
      expect(locationSpy.back).toHaveBeenCalled();
    }));
  });

  describe('labels de fluxo e histórico', () => {
    beforeEach(fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicket() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlow());
      create(); fixture.detectChanges(); tick();
    }));

    it('flowStageLabel retorna o label ou "Fluxo pendente" para null', () => {
      expect(c.flowStageLabel('Triagem')).toBe('Triagem');
      expect(c.flowStageLabel(null)).toBe('Fluxo pendente');
    });

    it('toggleFlowHistory alterna a visibilidade do histórico', () => {
      expect(c.isFlowHistoryVisible).toBeFalse();
      c.toggleFlowHistory();
      expect(c.isFlowHistoryVisible).toBeTrue();
    });
  });
});
