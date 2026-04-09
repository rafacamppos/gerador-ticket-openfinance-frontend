import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, RouterStateSnapshot } from '@angular/router';

import { ownerAccessGuard } from './owner-access.guard';
import { PortalAuthService } from '../services/portal-auth.service';

describe('ownerAccessGuard', () => {
  let authServiceSpy: jasmine.SpyObj<PortalAuthService>;

  const mockState = { url: '/' } as RouterStateSnapshot;
  const run = (ownerSlug: string) => {
    const route = { paramMap: convertToParamMap(ownerSlug ? { ownerSlug } : {}) } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => ownerAccessGuard(route, mockState));
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<PortalAuthService>('PortalAuthService', [
      'ensureSession', 'canAccessOwner', 'getHomeRoute',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: PortalAuthService, useValue: authServiceSpy }],
    });
  });

  it('redireciona para /login sem sessão ativa', async () => {
    authServiceSpy.ensureSession.and.resolveTo(false);
    expect(String(await run('iniciadora-pagamentos'))).toBe('/login');
  });

  it('permite acesso quando o usuário tem permissão para o owner', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);
    authServiceSpy.canAccessOwner.and.returnValue(true);
    expect(await run('iniciadora-pagamentos')).toBeTrue();
  });

  it('redireciona para home quando usuário não tem permissão para o owner', async () => {
    authServiceSpy.ensureSession.and.resolveTo(true);
    authServiceSpy.canAccessOwner.and.returnValue(false);
    authServiceSpy.getHomeRoute.and.returnValue('/areas/detentora-pagamentos');
    expect(String(await run('servicos-outbound'))).toBe('/areas/detentora-pagamentos');
  });

  it('redireciona para /login em caso de erro inesperado', async () => {
    authServiceSpy.ensureSession.and.rejectWith(new Error('Erro'));
    expect(String(await run('consentimentos-inbound'))).toBe('/login');
  });
});
