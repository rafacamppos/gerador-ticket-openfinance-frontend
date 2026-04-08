import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { TicketDetailPageComponent } from './ticket-detail-page.component';
import { OpenFinanceApiService, TicketFlowResponse } from '../services/open-finance-api.service';
import { OpenFinanceTicketService } from '../services/open-finance-ticket.service';
import { ToastService } from '../services/toast.service';
import { TicketFlowState } from '../services/open-finance-flow.models';

function makeFlowState(overrides: Partial<TicketFlowState> = {}): TicketFlowState {
  return {
    ticket_id: '42',
    ticket_title: 'Ticket de Teste',
    ticket_status: 'EM ATENDIMENTO N2',
    current_stage: 'routed_to_owner',
    current_stage_label: 'Direcionado para equipe',
    current_owner_slug: 'consentimentos-outbound',
    current_owner_name: 'Consentimentos Outbound',
    assigned_owner_slug: 'consentimentos-outbound',
    assigned_owner_name: 'Consentimentos Outbound',
    accepted_by_team: false,
    responded_by_team: false,
    returned_to_su: false,
    last_actor_name: null,
    last_actor_email: null,
    last_action: null,
    last_action_label: null,
    created_at: '2026-04-01T10:00:00',
    updated_at: '2026-04-01T10:05:00',
    ...overrides,
  };
}

function makeFlowResponse(stateOverrides: Partial<TicketFlowState> = {}): TicketFlowResponse {
  return {
    state: makeFlowState(stateOverrides),
    events: [],
  };
}

function makeTicketDetail(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ticket: {
      id: '42',
      title: 'Ticket de Teste',
      status: 'EM ATENDIMENTO N2',
      sr_type: 'Incidente',
      type: '1',
      template: '20',
      category: { nivel1: 'Cat', nivel2: 'Sub', nivel3: 'Nivel 3' },
      description: { summary: 'Descricao do ticket' },
    },
    routing: {
      owner_slug: 'consentimentos-outbound',
      owner_name: 'Consentimentos Outbound',
    },
    assignment: { grupo: 'N2_Santander', instituicao_requerente: 'Banco X' },
    timestamps: {
      criado_em: '2026-04-01T10:00:00',
      criado_em_ms: 1000,
      atualizado_em: '2026-04-01T10:05:00',
      atualizado_em_ms: 2000,
    },
    flow: makeFlowState(),
    ...overrides,
  };
}

describe('TicketDetailPageComponent', () => {
  let fixture: ComponentFixture<TicketDetailPageComponent>;
  let component: TicketDetailPageComponent;
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let ticketServiceSpy: jasmine.SpyObj<OpenFinanceTicketService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let locationSpy: jasmine.SpyObj<Location>;

  function setupRoute(ticketId: string | null, ownerSlug = ''): void {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          paramMap: convertToParamMap(ticketId ? { ticketId } : {}),
          queryParamMap: convertToParamMap(ownerSlug ? { ownerSlug } : {}),
        },
      },
    });
  }

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', [
      'getTicketById',
      'getTicketFlow',
      'transitionTicketFlow',
    ]);
    ticketServiceSpy = jasmine.createSpyObj<OpenFinanceTicketService>(
      'OpenFinanceTicketService',
      ['clearCache']
    );
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);
    locationSpy = jasmine.createSpyObj<Location>('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [TicketDetailPageComponent],
      providers: [
        provideRouter([]),
        { provide: OpenFinanceApiService, useValue: apiSpy },
        { provide: OpenFinanceTicketService, useValue: ticketServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Location, useValue: locationSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ ticketId: '42' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(TicketDetailPageComponent);
    component = fixture.componentInstance;
  }

  describe('ngOnInit', () => {
    it('carrega ticket e fluxo ao inicializar', fakeAsync(() => {
      const ticket = makeTicketDetail();
      const flow = makeFlowResponse();

      apiSpy.getTicketById.and.resolveTo(ticket as never);
      apiSpy.getTicketFlow.and.resolveTo(flow);

      createComponent();
      fixture.detectChanges();
      tick();

      expect(apiSpy.getTicketById).toHaveBeenCalledOnceWith('42');
      expect(apiSpy.getTicketFlow).toHaveBeenCalledOnceWith('42');
      expect((component as unknown as { isLoading: boolean }).isLoading).toBeFalse();
      expect((component as unknown as { ticket: unknown }).ticket).toEqual(ticket);
      expect((component as unknown as { flow: unknown }).flow).toEqual(flow);
    }));

    it('exibe erro quando ticketId nao esta na rota', fakeAsync(() => {
      setupRoute(null);

      createComponent();
      fixture.detectChanges();
      tick();

      expect(apiSpy.getTicketById).not.toHaveBeenCalled();
      expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
        'Ticket não informado.'
      );
      expect((component as unknown as { isLoading: boolean }).isLoading).toBeFalse();
    }));

    it('exibe mensagem de sessao expirada para erro 401', fakeAsync(() => {
      apiSpy.getTicketById.and.rejectWith(new HttpErrorResponse({ status: 401 }));
      apiSpy.getTicketFlow.and.rejectWith(new HttpErrorResponse({ status: 401 }));

      createComponent();
      fixture.detectChanges();
      tick();

      expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
        'Nao foi possivel renovar a sessao automaticamente na integracao Open Finance.'
      );
    }));

    it('exibe mensagem com status para outros erros HTTP', fakeAsync(() => {
      apiSpy.getTicketById.and.rejectWith(new HttpErrorResponse({ status: 404 }));
      apiSpy.getTicketFlow.and.rejectWith(new HttpErrorResponse({ status: 404 }));

      createComponent();
      fixture.detectChanges();
      tick();

      expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
        'Falha ao carregar ticket (404).'
      );
    }));

    it('exibe mensagem do Error para erros genericos', fakeAsync(() => {
      apiSpy.getTicketById.and.rejectWith(new Error('Falha de conexao'));
      apiSpy.getTicketFlow.and.rejectWith(new Error('Falha de conexao'));

      createComponent();
      fixture.detectChanges();
      tick();

      expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
        'Falha de conexao'
      );
    }));
  });

  describe('statusBadgeClass', () => {
    beforeEach(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlowResponse());
      createComponent();
      fixture.detectChanges();
    });

    const cases: Array<[string, string]> = [
      ['NOVO', 'ticket-detail__status--open'],
      ['Aberto', 'ticket-detail__status--open'],
      ['new status', 'ticket-detail__status--open'],
      ['Em andamento', 'ticket-detail__status--in-progress'],
      ['Em análise', 'ticket-detail__status--in-progress'],
      ['Em Progresso', 'ticket-detail__status--in-progress'],
      ['Aguardando', 'ticket-detail__status--waiting'],
      ['Pendente', 'ticket-detail__status--waiting'],
      ['waiting', 'ticket-detail__status--waiting'],
      ['Resolvido', 'ticket-detail__status--resolved'],
      ['Respondido', 'ticket-detail__status--resolved'],
      ['resolved', 'ticket-detail__status--resolved'],
      ['Fechado', 'ticket-detail__status--closed'],
      ['Encerrado', 'ticket-detail__status--closed'],
      ['closed', 'ticket-detail__status--closed'],
      ['Cancelado', 'ticket-detail__status--cancelled'],
      ['Recusado', 'ticket-detail__status--cancelled'],
      ['rejected', 'ticket-detail__status--cancelled'],
      ['OUTRO STATUS', ''],
    ];

    cases.forEach(([status, expectedClass]) => {
      it(`retorna "${expectedClass}" para status "${status}"`, () => {
        const result = (component as unknown as { statusBadgeClass(s: unknown): string }).statusBadgeClass(status);
        expect(result).toBe(expectedClass);
      });
    });

    it('retorna string vazia para status nao-string', () => {
      const result = (component as unknown as { statusBadgeClass(s: unknown): string }).statusBadgeClass(null);
      expect(result).toBe('');
    });
  });

  describe('formatValue', () => {
    beforeEach(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlowResponse());
      createComponent();
      fixture.detectChanges();
    });

    it('retorna "Nao informado" para null', () => {
      expect((component as unknown as { formatValue(v: unknown): string }).formatValue(null)).toBe('Nao informado');
    });

    it('retorna "Nao informado" para undefined', () => {
      expect((component as unknown as { formatValue(v: unknown): string }).formatValue(undefined)).toBe('Nao informado');
    });

    it('retorna "Nao informado" para string vazia', () => {
      expect((component as unknown as { formatValue(v: unknown): string }).formatValue('')).toBe('Nao informado');
    });

    it('retorna "Sim" para true', () => {
      expect((component as unknown as { formatValue(v: unknown): string }).formatValue(true)).toBe('Sim');
    });

    it('retorna "Nao" para false', () => {
      expect((component as unknown as { formatValue(v: unknown): string }).formatValue(false)).toBe('Nao');
    });

    it('serializa objetos como JSON formatado', () => {
      const result = (component as unknown as { formatValue(v: unknown): string }).formatValue({ key: 'value' });
      expect(result).toBe('{\n  "key": "value"\n}');
    });

    it('converte valores primitivos para string', () => {
      expect((component as unknown as { formatValue(v: unknown): string }).formatValue(42)).toBe('42');
      expect((component as unknown as { formatValue(v: unknown): string }).formatValue('texto')).toBe('texto');
    });
  });

  describe('toggleSection / isSectionOpen', () => {
    beforeEach(fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlowResponse());
      createComponent();
      fixture.detectChanges();
      tick();
    }));

    it('secao "contexto-api" esta fechada por padrao', () => {
      expect((component as unknown as { isSectionOpen(k: string): boolean }).isSectionOpen('contexto-api')).toBeFalse();
    });

    it('secao "descricao" esta aberta por padrao', () => {
      expect((component as unknown as { isSectionOpen(k: string): boolean }).isSectionOpen('descricao')).toBeTrue();
    });

    it('toggleSection abre uma secao fechada', () => {
      (component as unknown as { toggleSection(k: string): void }).toggleSection('contexto-api');
      expect((component as unknown as { isSectionOpen(k: string): boolean }).isSectionOpen('contexto-api')).toBeTrue();
    });

    it('toggleSection fecha uma secao aberta', () => {
      (component as unknown as { toggleSection(k: string): void }).toggleSection('contexto-api');
      (component as unknown as { toggleSection(k: string): void }).toggleSection('contexto-api');
      expect((component as unknown as { isSectionOpen(k: string): boolean }).isSectionOpen('contexto-api')).toBeFalse();
    });
  });

  describe('transicoes de fluxo', () => {
    beforeEach(fakeAsync(() => {
      const ticket = makeTicketDetail();
      const flow = makeFlowResponse({ current_stage: 'routed_to_owner', current_owner_slug: 'consentimentos-outbound' });

      apiSpy.getTicketById.and.resolveTo(ticket as never);
      apiSpy.getTicketFlow.and.resolveTo(flow);

      setupRoute('42', 'consentimentos-outbound');
      createComponent();
      fixture.detectChanges();
      tick();
    }));

    it('acceptTicket chama transitionTicketFlow com acao accept', fakeAsync(() => {
      const updatedFlow = makeFlowResponse({ current_stage: 'accepted_by_owner' });
      apiSpy.transitionTicketFlow.and.resolveTo(updatedFlow);

      (component as unknown as { acceptTicket(): Promise<void> }).acceptTicket();
      tick();

      expect(apiSpy.transitionTicketFlow).toHaveBeenCalledOnceWith('42', jasmine.objectContaining({ action: 'accept' }));
      expect(toastServiceSpy.success).toHaveBeenCalledWith('Fluxo atualizado com sucesso.');
      expect(ticketServiceSpy.clearCache).toHaveBeenCalled();
      expect((component as unknown as { flow: unknown }).flow).toEqual(updatedFlow);
    }));

    it('exibe erro quando transitionTicketFlow falha com HttpErrorResponse', fakeAsync(() => {
      apiSpy.transitionTicketFlow.and.rejectWith(new HttpErrorResponse({ status: 422 }));

      (component as unknown as { acceptTicket(): Promise<void> }).acceptTicket();
      tick();

      expect((component as unknown as { flowErrorMessage: string }).flowErrorMessage).toBe(
        'Falha ao atualizar fluxo (422).'
      );
      expect((component as unknown as { isSubmittingFlow: boolean }).isSubmittingFlow).toBeFalse();
    }));

    it('exibe mensagem do Error quando transitionTicketFlow falha', fakeAsync(() => {
      apiSpy.transitionTicketFlow.and.rejectWith(new Error('Servico indisponivel'));

      (component as unknown as { respondTicket(): Promise<void> }).respondTicket();
      tick();

      expect((component as unknown as { flowErrorMessage: string }).flowErrorMessage).toBe(
        'Servico indisponivel'
      );
    }));
  });

  describe('canRouteToOwner / canAccept / canRespond / canReject / canReturnToSu', () => {
    it('canRouteToOwner retorna true para su-super-usuarios com stage triage_su', fakeAsync(() => {
      const flow = makeFlowResponse({ current_stage: 'triage_su' });
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(flow);

      setupRoute('42', 'su-super-usuarios');
      createComponent();
      fixture.detectChanges();
      tick();

      expect((component as unknown as { canRouteToOwner(): boolean }).canRouteToOwner()).toBeTrue();
    }));

    it('canAccept retorna true quando owner e stage corretos', fakeAsync(() => {
      const flow = makeFlowResponse({ current_stage: 'routed_to_owner', current_owner_slug: 'iniciadora-pagamentos' });
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(flow);

      setupRoute('42', 'iniciadora-pagamentos');
      createComponent();
      fixture.detectChanges();
      tick();

      expect((component as unknown as { canAccept(): boolean }).canAccept()).toBeTrue();
    }));

    it('canRespond retorna true quando stage e accepted_by_owner para o owner correto', fakeAsync(() => {
      const flow = makeFlowResponse({ current_stage: 'accepted_by_owner', current_owner_slug: 'detentora-pagamentos' });
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(flow);

      setupRoute('42', 'detentora-pagamentos');
      createComponent();
      fixture.detectChanges();
      tick();

      expect((component as unknown as { canRespond(): boolean }).canRespond()).toBeTrue();
      expect((component as unknown as { canReturnToSu(): boolean }).canReturnToSu()).toBeTrue();
    }));

    it('canReject retorna true para stages routed_to_owner ou accepted_by_owner', fakeAsync(() => {
      const flow = makeFlowResponse({ current_stage: 'accepted_by_owner', current_owner_slug: 'servicos-outbound' });
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(flow);

      setupRoute('42', 'servicos-outbound');
      createComponent();
      fixture.detectChanges();
      tick();

      expect((component as unknown as { canReject(): boolean }).canReject()).toBeTrue();
    }));
  });

  describe('routeToResponsibleOwner', () => {
    beforeEach(fakeAsync(() => {
      const flow = makeFlowResponse({ current_stage: 'triage_su' });
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(flow);

      setupRoute('42', 'su-super-usuarios');
      createComponent();
      fixture.detectChanges();
      tick();
    }));

    it('exibe erro quando targetOwnerSlug nao esta selecionado', fakeAsync(() => {
      (component as unknown as { selectedRouteOwnerSlug: string }).selectedRouteOwnerSlug = '';

      (component as unknown as { routeToResponsibleOwner(): Promise<void> }).routeToResponsibleOwner();
      tick();

      expect((component as unknown as { flowErrorMessage: string }).flowErrorMessage).toBe(
        'Selecione a equipe responsavel antes de direcionar o ticket.'
      );
      expect(apiSpy.transitionTicketFlow).not.toHaveBeenCalled();
    }));

    it('direciona ticket para o owner selecionado', fakeAsync(() => {
      (component as unknown as { selectedRouteOwnerSlug: string }).selectedRouteOwnerSlug =
        'consentimentos-inbound';
      const updatedFlow = makeFlowResponse({ current_stage: 'routed_to_owner' });
      apiSpy.transitionTicketFlow.and.resolveTo(updatedFlow);

      (component as unknown as { routeToResponsibleOwner(): Promise<void> }).routeToResponsibleOwner();
      tick();

      expect(apiSpy.transitionTicketFlow).toHaveBeenCalledOnceWith(
        '42',
        jasmine.objectContaining({
          action: 'route_to_owner',
          targetOwnerSlug: 'consentimentos-inbound',
          targetOwnerName: 'Consentimentos Inbound',
        })
      );
    }));
  });

  describe('goBack', () => {
    it('navega para a area do owner quando ownerSlug esta na query', fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlowResponse());

      setupRoute('42', 'consentimentos-outbound');
      createComponent();
      fixture.detectChanges();
      tick();

      const routerSpy = TestBed.inject(Router);
      spyOn(routerSpy, 'navigate').and.resolveTo(true);

      (component as unknown as { goBack(): void }).goBack();

      expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/areas', 'consentimentos-outbound']);
    }));

    it('chama location.back() quando ownerSlug nao esta na query', fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlowResponse());

      setupRoute('42');
      createComponent();
      fixture.detectChanges();
      tick();

      (component as unknown as { goBack(): void }).goBack();

      expect(locationSpy.back).toHaveBeenCalled();
    }));
  });

  describe('flowStageLabel / flowActionLabel', () => {
    beforeEach(fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlowResponse());
      createComponent();
      fixture.detectChanges();
      tick();
    }));

    it('flowStageLabel retorna label quando informado', () => {
      expect((component as unknown as { flowStageLabel(l: string | null | undefined): string }).flowStageLabel('Triagem SU')).toBe('Triagem SU');
    });

    it('flowStageLabel retorna "Fluxo pendente" para null', () => {
      expect((component as unknown as { flowStageLabel(l: string | null | undefined): string }).flowStageLabel(null)).toBe('Fluxo pendente');
    });

    it('flowActionLabel retorna label quando informado', () => {
      expect((component as unknown as { flowActionLabel(l: string | null | undefined): string }).flowActionLabel('Aceitar')).toBe('Aceitar');
    });

    it('flowActionLabel retorna "Atualizacao" para undefined', () => {
      expect((component as unknown as { flowActionLabel(l: string | null | undefined): string }).flowActionLabel(undefined)).toBe('Atualização');
    });
  });

  describe('toggleFlowHistory', () => {
    beforeEach(fakeAsync(() => {
      apiSpy.getTicketById.and.resolveTo(makeTicketDetail() as never);
      apiSpy.getTicketFlow.and.resolveTo(makeFlowResponse());
      createComponent();
      fixture.detectChanges();
      tick();
    }));

    it('alterna visibilidade do historico do fluxo', () => {
      expect((component as unknown as { isFlowHistoryVisible: boolean }).isFlowHistoryVisible).toBeFalse();

      (component as unknown as { toggleFlowHistory(): void }).toggleFlowHistory();
      expect((component as unknown as { isFlowHistoryVisible: boolean }).isFlowHistoryVisible).toBeTrue();

      (component as unknown as { toggleFlowHistory(): void }).toggleFlowHistory();
      expect((component as unknown as { isFlowHistoryVisible: boolean }).isFlowHistoryVisible).toBeFalse();
    });
  });
});
