import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { dashboardGuard } from './dashboard.guard';
import { PortalAuthService } from '../services/portal-auth.service';

describe('dashboardGuard', () => {
  let authServiceSpy: jasmine.SpyObj<PortalAuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<PortalAuthService>('PortalAuthService', [
      'ensureSession',
      'getProfile',
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

  async function runGuard(): Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() => dashboardGuard());
  }

  it('redireciona para /login quando sessao nao esta ativa', async () => {
    authServiceSpy.ensureSession.and.resolveTo(false);

    const result = await runGuard();

    expect(routerSpy.parseUrl).toHaveBeenCalledOnceWith('/login');
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('retorna true quando usuario e perfil adm', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);
    authServiceSpy.getProfile.and.returnValue('adm');

    const result = await runGuard();

    expect(result).toBeTrue();
    expect(routerSpy.parseUrl).not.toHaveBeenCalled();
  });

  it('redireciona para rota home quando usuario nao e adm', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);
    authServiceSpy.getProfile.and.returnValue('user');
    authServiceSpy.getHomeRoute.and.returnValue('/areas/consentimentos-outbound');

    const result = await runGuard();

    expect(routerSpy.parseUrl).toHaveBeenCalledOnceWith('/areas/consentimentos-outbound');
    expect((result as UrlTree).toString()).toBe('/areas/consentimentos-outbound');
  });

  it('redireciona para /login quando ensureSession lanca excecao', async () => {
    authServiceSpy.ensureSession.and.rejectWith(new Error('Falha de autenticacao'));

    const result = await runGuard();

    expect(routerSpy.parseUrl).toHaveBeenCalledOnceWith('/login');
    expect((result as UrlTree).toString()).toBe('/login');
  });
});
