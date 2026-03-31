import { TestBed } from '@angular/core/testing';

import { OpenFinanceApiService, PortalUser } from './open-finance-api.service';
import { OpenFinanceTicketService } from './open-finance-ticket.service';
import { PortalAuthService } from './portal-auth.service';
import { TicketListFacadeService } from './ticket-list-facade.service';

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

  it('precarrega tickets conhecidos da equipe no login', async () => {
    const user: PortalUser = {
      id: '7',
      name: 'Operador',
      email: 'operador@empresa.com',
      profile: 'user',
      team: {
        id: '3',
        slug: 'consentimentos-outbound',
        name: 'Consentimentos Outbound',
      },
    };
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
    const user: PortalUser = {
      id: '1',
      name: 'Administrador',
      email: 'admin@empresa.com',
      profile: 'adm',
      team: {
        id: '1',
        slug: 'su-super-usuarios',
        name: 'SU (Super Usuário)',
      },
    };
    apiSpy.login.and.resolveTo(user);
    ticketListFacadeSpy.preloadKnownTickets.and.rejectWith(new Error('Falha ao carregar cache'));

    const response = await service.login('admin@empresa.com', '123456');

    expect(response).toEqual(user);
    expect(ticketListFacadeSpy.preloadKnownTickets).toHaveBeenCalledOnceWith(
      'su-super-usuarios'
    );
  });
});
