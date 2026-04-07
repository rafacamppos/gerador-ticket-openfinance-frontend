import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LoginPageComponent } from './login-page.component';
import { PortalAuthService } from '../services/portal-auth.service';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let authServiceSpy: jasmine.SpyObj<PortalAuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<PortalAuthService>('PortalAuthService', [
      'login',
      'getHomeRoute',
    ]);
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
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exibe erro quando email esta vazio', fakeAsync(() => {
    (component as unknown as { email: string }).email = '';
    (component as unknown as { password: string }).password = 'senha123';

    (component as unknown as { submit(): Promise<void> }).submit();
    tick();

    expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
      'Informe e-mail e senha.'
    );
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  }));

  it('exibe erro quando password esta vazio', fakeAsync(() => {
    (component as unknown as { email: string }).email = 'usuario@empresa.com';
    (component as unknown as { password: string }).password = '';

    (component as unknown as { submit(): Promise<void> }).submit();
    tick();

    expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
      'Informe e-mail e senha.'
    );
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  }));

  it('exibe erro quando email e apenas espacos', fakeAsync(() => {
    (component as unknown as { email: string }).email = '   ';
    (component as unknown as { password: string }).password = 'senha123';

    (component as unknown as { submit(): Promise<void> }).submit();
    tick();

    expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
      'Informe e-mail e senha.'
    );
  }));

  it('autentica com email com trim e redireciona para home route', fakeAsync(() => {
    const user = { id: '1', name: 'Admin', email: 'admin@empresa.com', profile: 'adm' as const, team: null };
    authServiceSpy.login.and.resolveTo(user);
    authServiceSpy.getHomeRoute.and.returnValue('/dashboard');

    (component as unknown as { email: string }).email = '  admin@empresa.com  ';
    (component as unknown as { password: string }).password = 'senha123';

    (component as unknown as { submit(): Promise<void> }).submit();
    tick();

    expect(authServiceSpy.login).toHaveBeenCalledOnceWith('admin@empresa.com', 'senha123');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledOnceWith('/dashboard');
    expect((component as unknown as { isSubmitting: boolean }).isSubmitting).toBeFalse();
    expect((component as unknown as { errorMessage: string }).errorMessage).toBe('');
  }));

  it('exibe erro "Usuario ou senha invalidos" para resposta 401', fakeAsync(() => {
    authServiceSpy.login.and.rejectWith(new HttpErrorResponse({ status: 401 }));

    (component as unknown as { email: string }).email = 'usuario@empresa.com';
    (component as unknown as { password: string }).password = 'senhaErrada';

    (component as unknown as { submit(): Promise<void> }).submit();
    tick();

    expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
      'Usuário ou senha inválidos.'
    );
    expect((component as unknown as { isSubmitting: boolean }).isSubmitting).toBeFalse();
  }));

  it('exibe erro com status para outros erros HTTP', fakeAsync(() => {
    authServiceSpy.login.and.rejectWith(new HttpErrorResponse({ status: 503 }));

    (component as unknown as { email: string }).email = 'usuario@empresa.com';
    (component as unknown as { password: string }).password = 'senha123';

    (component as unknown as { submit(): Promise<void> }).submit();
    tick();

    expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
      'Falha ao autenticar (503).'
    );
  }));

  it('exibe mensagem do Error para erros genericos', fakeAsync(() => {
    authServiceSpy.login.and.rejectWith(new Error('Timeout de conexao'));

    (component as unknown as { email: string }).email = 'usuario@empresa.com';
    (component as unknown as { password: string }).password = 'senha123';

    (component as unknown as { submit(): Promise<void> }).submit();
    tick();

    expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
      'Timeout de conexao'
    );
  }));

  it('exibe mensagem generica para erros desconhecidos', fakeAsync(() => {
    authServiceSpy.login.and.rejectWith('algo inesperado');

    (component as unknown as { email: string }).email = 'usuario@empresa.com';
    (component as unknown as { password: string }).password = 'senha123';

    (component as unknown as { submit(): Promise<void> }).submit();
    tick();

    expect((component as unknown as { errorMessage: string }).errorMessage).toBe(
      'Nao foi possivel autenticar.'
    );
  }));

  it('define isSubmitting como true durante o login e false apos concluir', fakeAsync(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resolveLogin!: (value: any) => void;
    authServiceSpy.login.and.returnValue(
      new Promise((resolve) => { resolveLogin = resolve; })
    );
    authServiceSpy.getHomeRoute.and.returnValue('/dashboard');

    (component as unknown as { email: string }).email = 'usuario@empresa.com';
    (component as unknown as { password: string }).password = 'senha123';

    (component as unknown as { submit(): Promise<void> }).submit();

    expect((component as unknown as { isSubmitting: boolean }).isSubmitting).toBeTrue();

    resolveLogin({ id: '1', name: 'Usuario', email: 'usuario@empresa.com', profile: 'user', team: null });
    tick();

    expect((component as unknown as { isSubmitting: boolean }).isSubmitting).toBeFalse();
  }));
});
