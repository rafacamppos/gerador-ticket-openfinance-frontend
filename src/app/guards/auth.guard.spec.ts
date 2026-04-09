import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, RouterStateSnapshot } from '@angular/router';

import { authGuard } from './auth.guard';
import { PortalAuthService } from '../services/portal-auth.service';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<PortalAuthService>;
  let router: Router;

  const mockRoute = { paramMap: convertToParamMap({}) } as unknown as ActivatedRouteSnapshot;
  const mockState = { url: '/' } as RouterStateSnapshot;
  const run = () => TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<PortalAuthService>('PortalAuthService', ['ensureSession']);

    TestBed.configureTestingModule({
      providers: [
        { provide: PortalAuthService, useValue: authServiceSpy },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('permite acesso quando sessão está ativa', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);
    expect(await run()).toBeTrue();
  });

  it('redireciona para /login quando não há sessão', async () => {
    authServiceSpy.ensureSession.and.resolveTo(false);
    expect(String(await run())).toBe('/login');
  });

  it('redireciona para /login em caso de erro inesperado', async () => {
    authServiceSpy.ensureSession.and.rejectWith(new Error('Erro de rede'));
    expect(String(await run())).toBe('/login');
  });
});
