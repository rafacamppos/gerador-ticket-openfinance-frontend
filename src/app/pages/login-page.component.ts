import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PortalAuthService } from '../services/portal-auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  private readonly authService = inject(PortalAuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected isSubmitting = false;
  protected errorMessage = '';

  protected async submit(): Promise<void> {
    if (!this.email.trim()) {
      this.errorMessage = 'Informe seu e-mail.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.email.trim(), '');
      await this.router.navigateByUrl(this.authService.getHomeRoute());
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.errorMessage = 'Usuário não encontrado.';
      } else if (error instanceof HttpErrorResponse) {
        this.errorMessage = `Falha ao autenticar (${error.status}).`;
      } else {
        this.errorMessage =
          error instanceof Error ? error.message : 'Nao foi possivel autenticar.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
