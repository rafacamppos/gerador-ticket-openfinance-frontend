import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ticket-dashboard-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ticket-dashboard-page.component.html',
  styleUrl: './ticket-dashboard-page.component.css',
})
export class TicketDashboardPageComponent {
  protected readonly priorityOwner = {
    title: 'SU (Super Usuário)',
    description: 'Triagem central, direcionamento operacional e visão consolidada dos fluxos.',
    route: '/areas/su-super-usuarios',
  };

  protected readonly owners = [
    {
      title: 'Iniciadora de Pagamentos',
      description: 'Operação focada em jornadas de iniciação e acompanhamento regulatório.',
      route: '/areas/iniciadora-pagamentos',
    },
    {
      title: 'Detentora de Pagamentos',
      description: 'Gestão de tickets e incidentes ligados à detenção de pagamentos.',
      route: '/areas/detentora-pagamentos',
    },
    {
      title: 'Consentimentos Inbound',
      description: 'Tratativa operacional dos fluxos de consentimento recebidos.',
      route: '/areas/consentimentos-inbound',
    },
    {
      title: 'Consentimentos Outbound',
      description: 'Acompanhamento de incidentes e tickets de consentimentos enviados.',
      route: '/areas/consentimentos-outbound',
    },
    {
      title: 'Serviços Outbound',
      description: 'Operação dos serviços expostos e desvios de integração outbound.',
      route: '/areas/servicos-outbound',
    },
    {
      title: 'Compartilhamento de dados/Máq. Captura',
      description: 'Cobertura de compartilhamento de dados e máquina de captura.',
      route: '/areas/compartilhamento-dados-maq-captura',
    },
  ];
}
