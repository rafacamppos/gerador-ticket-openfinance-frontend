import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { PortalAuthService } from '../services/portal-auth.service';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<PortalAuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockRoute = { paramMap: convertToParamMap({}) } as unknown as ActivatedRouteSnapshot;
  const mockState = { url: '/' } as RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<PortalAuthService>('PortalAuthService', [
      'ensureSession',
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

  async function runGuard(): Promise<unknown> {
    return TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
  }

  it('retorna true quando sessao esta ativa', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);

    const result = await runGuard();

    expect(result).toBeTrue();
  });

  it('redireciona para /login quando sessao nao esta ativa', async () => {
    authServiceSpy.ensureSession.and.resolveTo(false);

    const result = await runGuard();

    expect(routerSpy.parseUrl).toHaveBeenCalledOnceWith('/login');
    expect((result as { toString(): string }).toString()).toBe('/login');
  });

  it('redireciona para /login quando ensureSession lanca excecao', async () => {
    authServiceSpy.ensureSession.and.rejectWith(new Error('Erro de rede'));

    const result = await runGuard();

    expect(routerSpy.parseUrl).toHaveBeenCalledOnceWith('/login');
    expect((result as { toString(): string }).toString()).toBe('/login');
  });
});
