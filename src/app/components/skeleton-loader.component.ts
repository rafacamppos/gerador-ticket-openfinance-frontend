import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  template: `
    <div class="skeleton-list">
      @for (item of items; track $index) {
        <div class="skeleton-card">
          <div class="skeleton-card__header">
            <div class="skeleton-dot"></div>
            <div class="skeleton-line skeleton-line--title"></div>
          </div>
          <div class="skeleton-line skeleton-line--badge"></div>
          <div class="skeleton-line skeleton-line--body"></div>
          <div class="skeleton-card__meta">
            <div class="skeleton-meta-col">
              <div class="skeleton-line skeleton-line--meta-label"></div>
              <div class="skeleton-line skeleton-line--meta-value"></div>
            </div>
            <div class="skeleton-meta-col">
              <div class="skeleton-line skeleton-line--meta-label"></div>
              <div class="skeleton-line skeleton-line--meta-value"></div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-list { display: flex; flex-direction: column; }
    .skeleton-card {
      margin: 12px 16px;
      padding: 18px 20px;
      border: 1px solid #e8edf0;
      border-radius: 12px;
      background: #ffffff;
    }
    .skeleton-card__header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .skeleton-dot {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      flex-shrink: 0;
      background: linear-gradient(90deg, #f0f0f0 25%, #e4ecef 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.4s ease-in-out infinite;
    }
    .skeleton-line {
      border-radius: 6px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e4ecef 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.4s ease-in-out infinite;
    }
    .skeleton-line--title { height: 15px; width: 65%; }
    .skeleton-line--badge { height: 22px; width: 140px; border-radius: 3px; margin-bottom: 12px; }
    .skeleton-line--body { height: 13px; width: 88%; margin-bottom: 4px; }
    .skeleton-card__meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 22px;
      margin-top: 16px;
    }
    .skeleton-meta-col { display: flex; flex-direction: column; gap: 8px; padding-left: 22px; border-left: 3px solid #e8edf0; }
    .skeleton-line--meta-label { height: 12px; width: 80%; }
    .skeleton-line--meta-value { height: 16px; width: 60%; }
    @keyframes skeleton-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() count = 5;
  protected get items(): number[] { return Array(this.count).fill(0); }
}
