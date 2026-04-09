import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, RouterStateSnapshot } from '@angular/router';

import { dashboardGuard } from './dashboard.guard';
import { PortalAuthService } from '../services/portal-auth.service';

describe('dashboardGuard', () => {
  let authServiceSpy: jasmine.SpyObj<PortalAuthService>;

  const mockRoute = { paramMap: convertToParamMap({}) } as unknown as ActivatedRouteSnapshot;
  const mockState = { url: '/dashboard' } as RouterStateSnapshot;
  const run = () => TestBed.runInInjectionContext(() => dashboardGuard(mockRoute, mockState));

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<PortalAuthService>('PortalAuthService', [
      'ensureSession', 'getProfile', 'getHomeRoute',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: PortalAuthService, useValue: authServiceSpy }],
    });
  });

  it('redireciona para /login sem sessão ativa', async () => {
    authServiceSpy.ensureSession.and.resolveTo(false);
    expect(String(await run())).toBe('/login');
  });

  it('permite acesso ao dashboard para administradores', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);
    authServiceSpy.getProfile.and.returnValue('adm');
    expect(await run()).toBeTrue();
  });

  it('redireciona usuários não-adm para a rota home da equipe', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);
    authServiceSpy.getProfile.and.returnValue('user');
    authServiceSpy.getHomeRoute.and.returnValue('/areas/consentimentos-outbound');
    expect(String(await run())).toBe('/areas/consentimentos-outbound');
  });

  it('redireciona para /login em caso de erro inesperado', async () => {
    authServiceSpy.ensureSession.and.rejectWith(new Error('Falha'));
    expect(String(await run())).toBe('/login');
  });
});
