import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LoginPageComponent } from './login-page.component';
import { PortalAuthService } from '../services/portal-auth.service';

type LoginComp = {
  email: string;
  isSubmitting: boolean; errorMessage: string;
  submit(): Promise<void>;
};

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let c: LoginComp;
  let authServiceSpy: jasmine.SpyObj<PortalAuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<PortalAuthService>('PortalAuthService', ['login', 'getHomeRoute']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    routerSpy.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: PortalAuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    c = fixture.componentInstance as unknown as LoginComp;
    fixture.detectChanges();
  });

  const camposObrigatorios: Array<[string, Partial<LoginComp>]> = [
    ['e-mail vazio',          { email: ''   }],
    ['e-mail só com espaços', { email: '  ' }],
  ];

  camposObrigatorios.forEach(([desc, campos]) => {
    it(`exibe erro e não chama API quando ${desc}`, fakeAsync(() => {
      Object.assign(c, campos);
      c.submit();
      tick();
      expect(c.errorMessage).toBe('Informe seu e-mail.');
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    }));
  });

  it('autentica com e-mail trimado e redireciona para home route', fakeAsync(() => {
    const user = { id: '1', name: 'Admin', email: 'a@b', profile: 'adm' as const, team: null };
    authServiceSpy.login.and.resolveTo(user);
    authServiceSpy.getHomeRoute.and.returnValue('/dashboard');

    c.email = '  admin@empresa.com  ';
    c.submit();
    tick();

    expect(authServiceSpy.login).toHaveBeenCalledOnceWith('admin@empresa.com', '');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledOnceWith('/dashboard');
    expect(c.isSubmitting).toBeFalse();
    expect(c.errorMessage).toBe('');
  }));

  const errosCasos: Array<[string, unknown, string]> = [
    ['401',          new HttpErrorResponse({ status: 401 }), 'Usuário não encontrado.'],
    ['503',          new HttpErrorResponse({ status: 503 }), 'Falha ao autenticar (503).'],
    ['Error',        new Error('Timeout'),                   'Timeout'],
    ['desconhecido', 'algo',                                 'Nao foi possivel autenticar.'],
  ];

  errosCasos.forEach(([label, err, expected]) => {
    it(`exibe mensagem correta para erro ${label}`, fakeAsync(() => {
      authServiceSpy.login.and.rejectWith(err);
      c.email = 'a@b';
      c.submit();
      tick();
      expect(c.errorMessage).toBe(expected);
      expect(c.isSubmitting).toBeFalse();
    }));
  });
});
