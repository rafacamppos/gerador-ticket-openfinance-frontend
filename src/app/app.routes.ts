import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { dashboardGuard } from './guards/dashboard.guard';
import { ownerAccessGuard } from './guards/owner-access.guard';

import { ApplicationIncidentDetailPageComponent } from './pages/application-incident-detail-page.component';
import { ApplicationIncidentsPageComponent } from './pages/application-incidents-page.component';
import { TicketDashboardPageComponent } from './pages/ticket-dashboard-page.component';
import { TicketDetailPageComponent } from './pages/ticket-detail-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { TicketOwnerPageComponent } from './pages/ticket-owner-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'dashboard',
    component: TicketDashboardPageComponent,
    canActivate: [dashboardGuard],
  },
  {
    path: 'areas/:ownerSlug',
    component: TicketOwnerPageComponent,
    canActivate: [authGuard, ownerAccessGuard],
  },
  {
    path: 'areas/:ownerSlug/incidentes-aplicacoes',
    component: ApplicationIncidentsPageComponent,
    canActivate: [authGuard, ownerAccessGuard],
  },
  {
    path: 'areas/:ownerSlug/incidentes-aplicacoes/:incidentId',
    component: ApplicationIncidentDetailPageComponent,
    canActivate: [authGuard, ownerAccessGuard],
  },
  {
    path: 'tickets/:ticketId',
    component: TicketDetailPageComponent,
    canActivate: [authGuard],
  },
];
