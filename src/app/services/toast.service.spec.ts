import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  it('adiciona um toast ao chamar show()', () => {
    service.show('Mensagem de teste', 'info');

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Mensagem de teste');
    expect(toasts[0].type).toBe('info');
  });

  it('atribui ids incrementais a cada toast', () => {
    service.show('Primeiro', 'info');
    service.show('Segundo', 'success');

    const toasts = service.toasts();
    expect(toasts[0].id).toBe(1);
    expect(toasts[1].id).toBe(2);
  });

  it('remove o toast automaticamente após o durationMs', fakeAsync(() => {
    service.show('Auto dismiss', 'info', 3000);
    expect(service.toasts().length).toBe(1);

    tick(3000);
    expect(service.toasts().length).toBe(0);
  }));

  it('usa 4000ms como duração padrão', fakeAsync(() => {
    service.show('Padrao');
    expect(service.toasts().length).toBe(1);

    tick(3999);
    expect(service.toasts().length).toBe(1);

    tick(1);
    expect(service.toasts().length).toBe(0);
  }));

  it('success() adiciona toast com tipo success e duração 4000ms', fakeAsync(() => {
    service.success('Operação realizada!');

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Operação realizada!');

    tick(4000);
    expect(service.toasts().length).toBe(0);
  }));

  it('error() adiciona toast com tipo error e duração 6000ms', fakeAsync(() => {
    service.error('Falha na operação.');

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');

    tick(5999);
    expect(service.toasts().length).toBe(1);

    tick(1);
    expect(service.toasts().length).toBe(0);
  }));

  it('warning() adiciona toast com tipo warning', () => {
    service.warning('Atenção!');

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('warning');
  });

  it('dismiss() remove o toast pelo id', () => {
    service.show('Toast A', 'info');
    service.show('Toast B', 'success');

    const idToRemove = service.toasts()[0].id;
    service.dismiss(idToRemove);

    const remaining = service.toasts();
    expect(remaining.length).toBe(1);
    expect(remaining[0].message).toBe('Toast B');
  });

  it('dismiss() com id inexistente nao altera a lista', () => {
    service.show('Unico', 'info');
    service.dismiss(9999);

    expect(service.toasts().length).toBe(1);
  });

  it('suporta multiplos toasts simultaneos', fakeAsync(() => {
    service.show('A', 'info', 1000);
    service.show('B', 'success', 2000);
    service.show('C', 'error', 3000);

    expect(service.toasts().length).toBe(3);

    tick(1000);
    expect(service.toasts().length).toBe(2);

    tick(1000);
    expect(service.toasts().length).toBe(1);

    tick(1000);
    expect(service.toasts().length).toBe(0);
  }));
});
