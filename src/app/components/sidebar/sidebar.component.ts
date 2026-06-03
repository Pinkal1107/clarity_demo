import { Component } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, RouterLinkActive, CommonModule],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">🛡️</div>
        <div class="brand-text">
          <span class="brand-name">ClarityGuard</span>
          <span class="brand-tagline">AI Speech Detection</span>
        </div>
      </div>

      <nav class="nav">
        <a *ngFor="let item of navItems"
           [routerLink]="item.path"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{exact: item.path === '/'}"
           class="nav-item">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="status-dot"></div>
        <span>System Active</span>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-w); height: 100vh; position: fixed; left: 0; top: 0;
      background: linear-gradient(180deg, var(--primary-dark) 0%, var(--primary) 100%);
      display: flex; flex-direction: column;
      box-shadow: 4px 0 20px rgba(0,0,0,.15);
      z-index: 100;
    }
    .brand {
      display: flex; align-items: center; gap: 12px;
      padding: 24px 20px 20px;
      border-bottom: 1px solid rgba(255,255,255,.1);
    }
    .brand-icon { font-size: 1.8rem; }
    .brand-name { display: block; font-size: 1.1rem; font-weight: 800; color: #fff; }
    .brand-tagline { display: block; font-size: 0.68rem; color: rgba(255,255,255,.6); letter-spacing: .5px; }

    .nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 14px; border-radius: 10px; color: rgba(255,255,255,.75);
      font-size: 0.9rem; font-weight: 500; transition: all .2s;
    }
    .nav-item:hover { background: rgba(255,255,255,.1); color: #fff; }
    .nav-item.active { background: rgba(255,255,255,.18); color: #fff; font-weight: 700; }
    .nav-icon { font-size: 1.1rem; width: 22px; text-align: center; }

    .sidebar-footer {
      padding: 16px 20px; border-top: 1px solid rgba(255,255,255,.1);
      display: flex; align-items: center; gap: 8px;
      color: rgba(255,255,255,.6); font-size: 0.78rem;
    }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #69f0ae;
      box-shadow: 0 0 6px #69f0ae; animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
  `]
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { path: '/', label: 'Upload', icon: '📤' },
    { path: '/results', label: 'Results', icon: '🔍' },
    { path: '/incidents', label: 'Incidents', icon: '🚨' },
    { path: '/insights', label: 'Insights', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];
}
