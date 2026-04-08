import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { OpenFinanceApiService, PortalUser } from './open-finance-api.service';
import { OpenFinanceTicketService } from './open-finance-ticket.service';
import { PortalAuthService } from './portal-auth.service';
import { TicketListFacadeService } from './ticket-list-facade.service';

function makeUser(overrides: Partial<PortalUser> = {}): PortalUser {
  return {
    id: '1',
    name: 'Administrador',
    email: 'admin@empresa.com',
    profile: 'adm',
    team: {
      id: '1',
      slug: 'su-super-usuarios',
      name: 'SU (Super Usuário)',
    },
    ...overrides,
  };
}

describe('PortalAuthService', () => {
  let apiSpy: jasmine.SpyObj<OpenFinanceApiService>;
  let ticketListFacadeSpy: jasmine.SpyObj<TicketListFacadeService>;
  let ticketServiceSpy: jasmine.SpyObj<OpenFinanceTicketService>;
  let service: PortalAuthService;

  beforeEach(() => {
    sessionStorage.clear();

    apiSpy = jasmine.createSpyObj<OpenFinanceApiService>('OpenFinanceApiService', [
      'login',
      'getCurrentUser',
      'logout',
    ]);
    ticketListFacadeSpy = jasmine.createSpyObj<TicketListFacadeService>(
      'TicketListFacadeService',
      ['preloadKnownTickets']
    );
    ticketServiceSpy = jasmine.createSpyObj<OpenFinanceTicketService>('OpenFinanceTicketService', [
      'clearCache',
    ]);

    TestBed.configureTestingModule({
      providers: [
        PortalAuthService,
        { provide: OpenFinanceApiService, useValue: apiSpy },
        { provide: TicketListFacadeService, useValue: ticketListFacadeSpy },
        { provide: OpenFinanceTicketService, useValue: ticketServiceSpy },
      ],
    });

    service = TestBed.inject(PortalAuthService);
  });

  describe('login', () => {
    it('precarrega tickets conhecidos da equipe no login', async () => {
      const user = makeUser({
        id: '7',
        name: 'Operador',
        email: 'operador@empresa.com',
        profile: 'user',
        team: { id: '3', slug: 'consentimentos-outbound', name: 'Consentimentos Outbound' },
      });
      apiSpy.login.and.resolveTo(user);
      ticketListFacadeSpy.preloadKnownTickets.and.resolveTo([]);

      const response = await service.login('operador@empresa.com', '123456');

      expect(response).toEqual(user);
      expect(ticketServiceSpy.clearCache).toHaveBeenCalled();
      expect(ticketListFacadeSpy.preloadKnownTickets).toHaveBeenCalledOnceWith(
        'consentimentos-outbound'
      );
      expect(service.getHomeRoute()).toBe('/areas/consentimentos-outbound');
    });

    it('nao falha o login quando o preload dos tickets conhecidos falha', async () => {
      const user = makeUser();
      apiSpy.login.and.resolveTo(user);
      ticketListFacadeSpy.preloadKnownTickets.and.rejectWith(new Error('Falha ao carregar cache'));

      const response = await service.login('admin@empresa.com', '123456');

      expect(response).toEqual(user);
      expect(ticketListFacadeSpy.preloadKnownTickets).toHaveBeenCalledOnceWith('su-super-usuarios');
    });

    it('nao chama preloadKnownTickets quando usuario nao tem equipe', async () => {
      const user = makeUser({ team: null });
      apiSpy.login.and.resolveTo(user);

      await service.login('admin@empresa.com', '123456');

      expect(ticketListFacadeSpy.preloadKnownTickets).not.toHaveBeenCalled();
    });
  });

  describe('ensureSession', () => {
    it('retorna true imediatamente quando usuario ja esta armazenado', async () => {
      const user = makeUser();
      apiSpy.login.and.resolveTo(user);
      ticketListFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('admin@empresa.com', '123456');
      apiSpy.getCurrentUser.calls.reset();

      const result = await service.ensureSession();

      expect(result).toBeTrue();
      expect(apiSpy.getCurrentUser).not.toHaveBeenCalled();
    });

    it('busca usuario atual e retorna true quando nao ha usuario em cache', async () => {
      const user = makeUser();
      apiSpy.getCurrentUser.and.resolveTo(user);
      ticketListFacadeSpy.preloadKnownTickets.and.resolveTo([]);

      const result = await service.ensureSession();

      expect(result).toBeTrue();
      expect(apiSpy.getCurrentUser).toHaveBeenCalled();
      expect(service.getUser()).toEqual(user);
    });

    it('retorna false e limpa usuario para erro 401', async () => {
      apiSpy.getCurrentUser.and.rejectWith(new HttpErrorResponse({ status: 401 }));

      const result = await service.ensureSession();

      expect(result).toBeFalse();
      expect(service.getUser()).toBeNull();
    });

    it('propaga outros erros HTTP', async () => {
      apiSpy.getCurrentUser.and.rejectWith(new HttpErrorResponse({ status: 500 }));

      await expectAsync(service.ensureSession()).toBeRejectedWith(
        jasmine.any(HttpErrorResponse)
      );
    });
  });

  describe('logout', () => {
    it('chama api.logout, limpa cache e usuario', async () => {
      const user = makeUser();
      apiSpy.login.and.resolveTo(user);
      ticketListFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('admin@empresa.com', '123456');

      apiSpy.logout.and.resolveTo();

      await service.logout();

      expect(apiSpy.logout).toHaveBeenCalled();
      expect(ticketServiceSpy.clearCache).toHaveBeenCalledTimes(2); // login + logout
      expect(service.getUser()).toBeNull();
    });

    it('limpa cache e usuario mesmo quando api.logout falha', async () => {
      const user = makeUser();
      apiSpy.login.and.resolveTo(user);
      ticketListFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('admin@empresa.com', '123456');

      apiSpy.logout.and.rejectWith(new Error('Falha ao deslogar'));

      // logout usa try/finally: o finally executa mas a excecao e relancada
      try { await service.logout(); } catch { /* esperado */ }

      expect(ticketServiceSpy.clearCache).toHaveBeenCalledTimes(2);
      expect(service.getUser()).toBeNull();
    });
  });

  describe('getters', () => {
    it('getUser retorna null quando nao ha usuario logado', () => {
      expect(service.getUser()).toBeNull();
    });

    it('getUserName retorna string vazia quando nao ha usuario logado', () => {
      expect(service.getUserName()).toBe('');
    });

    it('getProfile retorna null quando nao ha usuario logado', () => {
      expect(service.getProfile()).toBeNull();
    });

    it('getTeamSlug retorna string vazia quando nao ha usuario logado', () => {
      expect(service.getTeamSlug()).toBe('');
    });

    it('getHomeRoute retorna /dashboard para usuario adm', async () => {
      const user = makeUser({ profile: 'adm' });
      apiSpy.login.and.resolveTo(user);
      ticketListFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('admin@empresa.com', '123456');

      expect(service.getHomeRoute()).toBe('/dashboard');
    });

    it('getHomeRoute retorna /areas/teamSlug para usuario com equipe', async () => {
      const user = makeUser({ profile: 'user', team: { id: '2', slug: 'iniciadora-pagamentos', name: 'Iniciadora' } });
      apiSpy.login.and.resolveTo(user);
      ticketListFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('usuario@empresa.com', '123456');

      expect(service.getHomeRoute()).toBe('/areas/iniciadora-pagamentos');
    });

    it('getHomeRoute retorna /login quando usuario nao tem equipe', async () => {
      const user = makeUser({ profile: 'user', team: null });
      apiSpy.login.and.resolveTo(user);
      await service.login('usuario@empresa.com', '123456');

      expect(service.getHomeRoute()).toBe('/login');
    });
  });

  describe('canAccessOwner', () => {
    it('adm pode acessar qualquer owner', async () => {
      const user = makeUser({ profile: 'adm' });
      apiSpy.login.and.resolveTo(user);
      ticketListFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('admin@empresa.com', '123456');

      expect(service.canAccessOwner('qualquer-owner')).toBeTrue();
      expect(service.canAccessOwner('')).toBeTrue();
    });

    it('usuario pode acessar apenas o owner da sua equipe', async () => {
      const user = makeUser({ profile: 'user', team: { id: '3', slug: 'detentora-pagamentos', name: 'Detentora' } });
      apiSpy.login.and.resolveTo(user);
      ticketListFacadeSpy.preloadKnownTickets.and.resolveTo([]);
      await service.login('usuario@empresa.com', '123456');

      expect(service.canAccessOwner('detentora-pagamentos')).toBeTrue();
      expect(service.canAccessOwner('iniciadora-pagamentos')).toBeFalse();
      expect(service.canAccessOwner('')).toBeFalse();
    });
  });
});
