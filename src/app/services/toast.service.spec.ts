import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ToastService, ToastType } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  it('adiciona e remove toast automaticamente após o tempo configurado', fakeAsync(() => {
    service.show('Mensagem', 'info', 3000);
    expect(service.toasts().length).toBe(1);
    tick(3000);
    expect(service.toasts().length).toBe(0);
  }));

  it('usa 4000ms como duração padrão', fakeAsync(() => {
    service.show('Padrao');
    tick(3999);
    expect(service.toasts().length).toBe(1);
    tick(1);
    expect(service.toasts().length).toBe(0);
  }));

  const atalhos: Array<{ metodo: keyof ToastService; tipo: ToastType; duracao: number }> = [
    { metodo: 'success', tipo: 'success', duracao: 4000 },
    { metodo: 'warning', tipo: 'warning', duracao: 4000 },
    { metodo: 'error',   tipo: 'error',   duracao: 6000 },
  ];

  atalhos.forEach(({ metodo, tipo, duracao }) => {
    it(`${metodo}() usa tipo "${tipo}" e remove após ${duracao}ms`, fakeAsync(() => {
      (service[metodo] as (msg: string) => void)('Teste');
      expect(service.toasts()[0].type).toBe(tipo);
      tick(duracao);
      expect(service.toasts().length).toBe(0);
    }));
  });

  it('dismiss() remove apenas o toast pelo id informado', fakeAsync(() => {
    service.show('A', 'info', 9999);
    service.show('B', 'success', 9999);
    service.dismiss(service.toasts()[0].id);
    expect(service.toasts().map(t => t.message)).toEqual(['B']);
    tick(9999);
  }));
});
