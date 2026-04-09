import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { OpenFinanceApiService, PortalUser } from './open-finance-api.service';
import { OpenFinanceTicketService } from './open-finance-ticket.service';
import { PortalAuthService } from './portal-auth.service';
import { TicketListFacadeService } from './ticket-list-facade.service';

function makeUser(overrides: Partial<PortalUser> = {}): PortalUser {
  return {
    id: '1', name: 'Admin', email: 'admin@empresa.com', profile: 'adm',
    team: { id: '1', slug: 'su-super-usuarios', name: 'SU' },
    ...overrides,
  };
}

describe('PortalAuthService', () => {
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let ticketFacadeSpy: jasmine.SpyObj<TicketListFacadeService>;
  let ticketServiceSpy: jasmine.SpyObj<OpenFinanceTicketService>;
  let service: PortalAuthService;

  beforeEach(() => {
    sessionStorage.clear();
    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', ['login', 'getCurrentUser', 'logout']);
    ticketFacadeSpy = jasmine.createSpyObj<TicketListFacadeService>('TicketListFacadeService', ['preloadKnownTickets']);
    ticketServiceSpy = jasmine.createSpyObj<OpenFinanceTicketService>('OpenFinanceTicketService', ['clearCache']);

    TestBed.configureTestingModule({
      providers: [
        PortalAuthService,
        { provide: OpenFinanceApiService, useValue: apiSpy },
        { provide: TicketListFacadeService, useValue: ticketFacadeSpy },
        { provide: OpenFinanceTicketService, useValue: ticketServiceSpy },
      ],
    });

    service = TestBed.inject(PortalAuthService);
  });

  describe('login', () => {
    it('precarrega tickets da equipe e retorna o usuário autenticado', async () => {
      const user = makeUser({ profile: 'user', team: { id: '3', slug: 'consentimentos-outbound', name: 'CO' } });
      apiSpy.login.and.resolveTo(user);
      ticketFacadeSpy.preloadKnownTickets.and.resolveTo([]);

      expect(await service.login('u@x.com', '123')).toEqual(user);
      expect(ticketServiceSpy.clearCache).toHaveBeenCalled();
      expect(ticketFacadeSpy.preloadKnownTickets).toHaveBeenCalledOnceWith('consentimentos-outbound');
    });

    it('não falha quando o pré-carregamento de tickets falha', async () => {
      apiSpy.login.and.resolveTo(makeUser());
      ticketFacadeSpy.preloadKnownTickets.and.rejectWith(new Error('Falha cache'));
      await expectAsync(service.login('a@x.com', '123')).toBeResolved();
    });

    it('não chama preloadKnownTickets para usuário sem equipe', async () => {
      apiSpy.login.and.resolveTo(makeUser({ team: null }));
      await service.login('a@x.com', '123');
      expect(ticketFacadeSpy.preloadKnownTickets).not.toHaveBeenCalled();
    });
  });

  describe('ensureSession', () => {
    it('reutiliza sessão em memória sem chamar a API novamente', async () => {
      apiSpy.login.and.resolveTo(makeUser());
      ticketFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('a@x.com', '123');
      apiSpy.getCurrentUser.calls.reset();

      expect(await service.ensureSession()).toBeTrue();
      expect(apiSpy.getCurrentUser).not.toHaveBeenCalled();
    });

    it('valida sessão via API e armazena o usuário quando não há cache', async () => {
      const user = makeUser();
      apiSpy.getCurrentUser.and.resolveTo(user);
      ticketFacadeSpy.preloadKnownTickets.and.resolveTo([]);

      expect(await service.ensureSession()).toBeTrue();
      expect(service.getUser()).toEqual(user);
    });

    it('retorna false e limpa usuário para resposta 401', async () => {
      apiSpy.getCurrentUser.and.rejectWith(new HttpErrorResponse({ status: 401 }));
      expect(await service.ensureSession()).toBeFalse();
      expect(service.getUser()).toBeNull();
    });

    it('propaga erros não-401 para o chamador', async () => {
      apiSpy.getCurrentUser.and.rejectWith(new HttpErrorResponse({ status: 500 }));
      await expectAsync(service.ensureSession()).toBeRejectedWith(jasmine.any(HttpErrorResponse));
    });
  });

  describe('logout', () => {
    beforeEach(async () => {
      apiSpy.login.and.resolveTo(makeUser());
      ticketFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('a@x.com', '123');
    });

    it('limpa cache e sessão após logout bem-sucedido', async () => {
      apiSpy.logout.and.resolveTo();
      await service.logout();
      expect(ticketServiceSpy.clearCache).toHaveBeenCalledTimes(2);
      expect(service.getUser()).toBeNull();
    });

    it('ainda limpa cache e sessão mesmo quando o logout na API falha', async () => {
      apiSpy.logout.and.rejectWith(new Error('Falha'));
      try { await service.logout(); } catch { /* esperado */ }
      expect(service.getUser()).toBeNull();
    });
  });

  describe('roteamento e controle de acesso', () => {
    const rotaCasos: Array<[Partial<PortalUser>, string]> = [
      [{ profile: 'adm' },                                                  '/dashboard'],
      [{ profile: 'user', team: { id: '2', slug: 'iniciadora-pagamentos', name: 'IP' } }, '/areas/iniciadora-pagamentos'],
      [{ profile: 'user', team: null },                                     '/login'],
    ];

    rotaCasos.forEach(([override, rota]) => {
      it(`getHomeRoute retorna "${rota}" para ${override.profile} com equipe "${override.team?.slug ?? 'nenhuma'}"`, async () => {
        apiSpy.login.and.resolveTo(makeUser(override));
        ticketFacadeSpy.preloadKnownTickets.and.resolveTo([]);
        await service.login('a@x.com', '123');
        expect(service.getHomeRoute()).toBe(rota);
      });
    });

    it('administrador pode acessar qualquer owner', async () => {
      apiSpy.login.and.resolveTo(makeUser({ profile: 'adm' }));
      ticketFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('a@x.com', '123');
      expect(service.canAccessOwner('qualquer-owner')).toBeTrue();
    });

    it('usuário acessa apenas o owner da própria equipe', async () => {
      apiSpy.login.and.resolveTo(makeUser({ profile: 'user', team: { id: '3', slug: 'detentora-pagamentos', name: 'DP' } }));
      ticketFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('a@x.com', '123');
      expect(service.canAccessOwner('detentora-pagamentos')).toBeTrue();
      expect(service.canAccessOwner('iniciadora-pagamentos')).toBeFalse();
    });
  });
});
