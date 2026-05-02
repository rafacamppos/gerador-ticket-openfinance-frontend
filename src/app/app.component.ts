import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
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
import { ApplicationIncidentsService } from './services/application-incidents.service';
import { OpenFinanceTicketService } from './services/open-finance-ticket.service';
import { PortalAuthService } from './services/portal-auth.service';
import { ToastContainerComponent } from './components/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly ticketService = inject(OpenFinanceTicketService);
  private readonly applicationIncidentsService = inject(ApplicationIncidentsService);
  private readonly authService = inject(PortalAuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private routerSubscription: Subscription | null = null;

  protected userName = '';
  protected homeRoute = '/dashboard';
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
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
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
