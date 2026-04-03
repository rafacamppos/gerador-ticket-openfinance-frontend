import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { OpenFinanceApiService } from './services/open-finance-api.service';
import { ApplicationIncidentsService } from './services/application-incidents.service';
import { OpenFinanceTicketService } from './services/open-finance-ticket.service';
import { PortalAuthService } from './services/portal-auth.service';
import { ToastContainerComponent } from './components/toast-container.component';

type OpenFinanceEnvironment = {
  key: string;
  label: string;
  baseUrl: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly openFinanceApi = inject(OpenFinanceApiService);
  private readonly ticketService = inject(OpenFinanceTicketService);
  private readonly applicationIncidentsService = inject(ApplicationIncidentsService);
  private readonly authService = inject(PortalAuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private routerSubscription: Subscription | null = null;

  protected userName = '';
  protected homeRoute = '/dashboard';
  protected environments: OpenFinanceEnvironment[] = [];
  protected selectedEnvironmentKey = '';
  protected environmentError = '';
  protected isUpdatingEnvironment = false;
  protected isLoginRoute = this.router.url.startsWith('/login');
  protected isNavigating = false;

  async ngOnInit(): Promise<void> {
    this.routerSubscription = this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
        )
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.isNavigating = true;
          this.isLoginRoute = event.url.startsWith('/login');
          this.cdr.detectChanges();
          return;
        }

        this.isNavigating = false;
        this.isLoginRoute = this.router.url.startsWith('/login');
        this.userName = this.authService.getUserName();
        this.homeRoute = this.authService.getHomeRoute();
      });

    try {
      await this.authService.ensureSession();
      this.userName = this.authService.getUserName();
      this.homeRoute = this.authService.getHomeRoute();
    } catch {
      this.userName = '';
      this.homeRoute = '/login';
    }

    try {
      const payload = await this.openFinanceApi.getEnvironment();
      this.environments = payload.available || [];
      this.selectedEnvironmentKey = payload.current?.key || '';
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this.environmentError = `Falha ao carregar ambientes (${error.status}).`;
      } else {
        this.environmentError =
          error instanceof Error ? error.message : 'Nao foi possivel carregar os ambientes.';
      }
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  protected async updateEnvironment(event: Event): Promise<void> {
    const selectElement = event.target as HTMLSelectElement | null;
    const nextEnvironmentKey = selectElement?.value || '';

    if (!nextEnvironmentKey || nextEnvironmentKey === this.selectedEnvironmentKey) {
      return;
    }

    const previousEnvironmentKey = this.selectedEnvironmentKey;
    this.selectedEnvironmentKey = nextEnvironmentKey;
    this.environmentError = '';
    this.isUpdatingEnvironment = true;

    try {
      const payload = await this.openFinanceApi.updateEnvironment(nextEnvironmentKey);
      this.environments = payload.available || this.environments;
      this.selectedEnvironmentKey = payload.current?.key || nextEnvironmentKey;
      this.ticketService.clearCache();
      this.applicationIncidentsService.clearCache();
      window.location.reload();
    } catch (error) {
      this.selectedEnvironmentKey = previousEnvironmentKey;

      if (error instanceof HttpErrorResponse) {
        this.environmentError = `Falha ao alterar ambiente (${error.status}).`;
      } else {
        this.environmentError =
          error instanceof Error ? error.message : 'Nao foi possivel alterar o ambiente.';
      }
    } finally {
      this.isUpdatingEnvironment = false;
    }
  }

  protected async logout(): Promise<void> {
    await this.authService.logout();
    this.ticketService.clearCache();
    this.applicationIncidentsService.clearCache();
    this.userName = '';
    this.homeRoute = '/login';
    await this.router.navigateByUrl('/login');
  }
}
