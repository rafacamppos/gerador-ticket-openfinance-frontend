import { Component, Input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OWNER_TITLES } from '../ticket-owners';

type TeamMenuItem = {
  key: 'tickets' | 'incidents' | 'categories';
  label: string;
  href: string;
};

@Component({
  selector: 'app-team-workspace-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './team-workspace-header.component.html',
  styleUrl: './team-workspace-header.component.css',
})
export class TeamWorkspaceHeaderComponent {
  @Input({ required: true }) ownerSlug = '';
  @Input({ required: true }) activeMenu: 'tickets' | 'incidents' | 'categories' = 'tickets';

  protected readonly ownerTitle = computed(
    () => OWNER_TITLES[this.ownerSlug] ?? 'Area de Tickets'
  );

  protected menuItems(): TeamMenuItem[] {
    return [
      {
        key: 'tickets',
        label: 'Tickets',
        href: `/areas/${this.ownerSlug}`,
      },
      {
        key: 'incidents',
        label: 'Incidentes Aplicações',
        href: `/areas/${this.ownerSlug}/incidentes-aplicacoes`,
      },
    ];
  }

  protected isActiveMenu(key: TeamMenuItem['key']): boolean {
    return this.activeMenu === key;
  }
}
