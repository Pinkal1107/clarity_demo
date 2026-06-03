import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-left">
        <span class="page-title">{{ pageTitle }}</span>
      </div>
      <div class="header-right">
        <div class="stat-pill">
          <span class="pill-label">Files</span>
          <span class="pill-value">{{ totalFiles }}</span>
        </div>
        <div class="stat-pill danger">
          <span class="pill-label">Alerts</span>
          <span class="pill-value">{{ totalAlerts }}</span>
        </div>
        <div class="header-date">{{ now | date:'EEE, MMM d, y – h:mm a' }}</div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: fixed; top: 0; left: var(--sidebar-w); right: 0;
      height: var(--header-h); background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px; z-index: 90;
      box-shadow: 0 2px 8px rgba(25,82,186,.06);
    }
    .page-title { font-size: 1rem; font-weight: 700; color: var(--text-secondary); letter-spacing: .3px; }
    .header-right { display: flex; align-items: center; gap: 16px; }
    .stat-pill {
      display: flex; align-items: center; gap: 6px;
      background: var(--primary-bg); border: 1px solid var(--border);
      border-radius: 20px; padding: 5px 14px;
    }
    .stat-pill.danger { background: #fff5f5; border-color: #ffcdd2; }
    .pill-label { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    .pill-value { font-size: 0.9rem; font-weight: 800; color: var(--primary); }
    .stat-pill.danger .pill-value { color: var(--alert-red); }
    .header-date { font-size: 0.8rem; color: var(--text-muted); }
  `]
})
export class HeaderComponent implements OnInit {
  now = new Date();
  totalFiles = 0;
  totalAlerts = 0;
  pageTitle = 'ClarityGuard — AI Speech Detection Platform';

  constructor(private store: StoreService) {}

  ngOnInit() {
    this.store.results$.subscribe(r => { this.totalFiles = r.length; });
    this.store.incidents$.subscribe(i => { this.totalAlerts = i.filter(x => x.status === 'open').length; });
    setInterval(() => this.now = new Date(), 30000);
  }
}
