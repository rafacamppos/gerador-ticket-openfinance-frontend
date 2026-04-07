import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, UrlTree } from '@angular/router';

import { ownerAccessGuard } from './owner-access.guard';
import { PortalAuthService } from '../services/portal-auth.service';

describe('ownerAccessGuard', () => {
  let authServiceSpy: jasmine.SpyObj<PortalAuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<PortalAuthService>('PortalAuthService', [
      'ensureSession',
      'canAccessOwner',
      'getHomeRoute',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['parseUrl']);
    routerSpy.parseUrl.and.callFake((url: string) => ({ toString: () => url }) as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: PortalAuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  function makeRoute(ownerSlug: string): ActivatedRouteSnapshot {
    return {
      paramMap: convertToParamMap({ ownerSlug }),
    } as unknown as ActivatedRouteSnapshot;
  }

  async function runGuard(ownerSlug: string): Promise<unknown> {
    const route = makeRoute(ownerSlug);
    return TestBed.runInInjectionContext(() => ownerAccessGuard(route, null as never));
  }

  it('redireciona para /login quando sessao nao esta ativa', async () => {
    authServiceSpy.ensureSession.and.resolveTo(false);

    const result = await runGuard('consentimentos-outbound');

    expect(routerSpy.parseUrl).toHaveBeenCalledOnceWith('/login');
    expect((result as { toString(): string }).toString()).toBe('/login');
  });

  it('retorna true quando usuario tem acesso ao owner', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);
    authServiceSpy.canAccessOwner.and.returnValue(true);

    const result = await runGuard('iniciadora-pagamentos');

    expect(authServiceSpy.canAccessOwner).toHaveBeenCalledOnceWith('iniciadora-pagamentos');
    expect(result).toBeTrue();
  });

  it('redireciona para rota home quando usuario nao tem acesso ao owner', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);
    authServiceSpy.canAccessOwner.and.returnValue(false);
    authServiceSpy.getHomeRoute.and.returnValue('/areas/detentora-pagamentos');

    const result = await runGuard('servicos-outbound');

    expect(routerSpy.parseUrl).toHaveBeenCalledOnceWith('/areas/detentora-pagamentos');
    expect((result as { toString(): string }).toString()).toBe('/areas/detentora-pagamentos');
  });

  it('redireciona para /login quando ensureSession lanca excecao', async () => {
    authServiceSpy.ensureSession.and.rejectWith(new Error('Erro inesperado'));

    const result = await runGuard('consentimentos-inbound');

    expect(routerSpy.parseUrl).toHaveBeenCalledOnceWith('/login');
    expect((result as { toString(): string }).toString()).toBe('/login');
  });

  it('passa string vazia para canAccessOwner quando ownerSlug nao esta na rota', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);
    authServiceSpy.canAccessOwner.and.returnValue(false);
    authServiceSpy.getHomeRoute.and.returnValue('/login');

    const route = {
      paramMap: convertToParamMap({}),
    } as unknown as ActivatedRouteSnapshot;

    await TestBed.runInInjectionContext(() => ownerAccessGuard(route, null as never));

    expect(authServiceSpy.canAccessOwner).toHaveBeenCalledOnceWith('');
  });
});
