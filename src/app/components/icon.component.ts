import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name) {
        @case ('refresh') {
          <path d="M23 4v6h-6M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
        }
        @case ('ticket') {
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        }
        @case ('chevron-down') {
          <polyline points="6 9 12 15 18 9"/>
        }
        @case ('chevron-right') {
          <polyline points="9 18 15 12 9 6"/>
        }
        @case ('check') {
          <polyline points="20 6 9 17 4 12"/>
        }
        @case ('x-icon') {
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        }
        @case ('arrow-left') {
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        }
        @case ('alert') {
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        }
        @case ('inbox') {
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
          <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
        }
        @default {
          <circle cx="12" cy="12" r="10"/>
        }
      }
    </svg>
  `,
  styles: [`:host { display: inline-flex; align-items: center; vertical-align: middle; }`]
})
export class IconComponent {
  @Input({ required: true }) name!: string;
  @Input() size: number | string = 16;
}
