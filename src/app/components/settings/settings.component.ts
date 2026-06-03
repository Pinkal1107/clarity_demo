import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { AppSettings, ALERT_CATEGORIES } from '../../models/clarity.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-content fade-in">
      <div class="page-header">
        <h1>Settings</h1>
        <p>Configure language preferences, alert thresholds, and system behavior.</p>
      </div>

      <div class="settings-layout">

        <!-- Language Settings -->
        <div class="card settings-card">
          <div class="card-header"><h2>🌐 Language Settings</h2></div>
          <div class="settings-body">
            <div class="form-group">
              <label>Default Analysis Language</label>
              <select class="form-control" [(ngModel)]="settings.defaultLanguage">
                <option *ngFor="let l of settings.languages" [value]="l">{{ l }}</option>
              </select>
              <span class="hint">Primary language used when auto-detection is disabled.</span>
            </div>
            <div class="lang-chips">
              <p class="chip-label">Supported Languages</p>
              <div class="chips">
                <span *ngFor="let l of settings.languages" class="chip"
                      [class.chip-active]="l === settings.defaultLanguage"
                      (click)="settings.defaultLanguage = l">
                  {{ l }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Alert Thresholds -->
        <div class="card settings-card">
          <div class="card-header"><h2>🎚️ Alert Thresholds</h2></div>
          <div class="settings-body">
            <p class="section-desc">Set the minimum confidence score (%) required to trigger an alert for each category.</p>
            <div class="threshold-list">
              <div *ngFor="let cat of alertCats" class="threshold-row">
                <div class="thr-label">
                  <span class="thr-icon">{{ cat.icon }}</span>
                  <span>{{ cat.label }}</span>
                </div>
                <div class="thr-slider-wrap">
                  <input type="range" min="0" max="100" step="5"
                         [(ngModel)]="settings.thresholds[cat.key]"
                         class="thr-slider">
                  <div class="thr-track-fill"
                       [style.width.%]="settings.thresholds[cat.key]"
                       [style.background]="cat.color"></div>
                </div>
                <div class="thr-value-wrap">
                  <input type="number" min="0" max="100" step="5"
                         [(ngModel)]="settings.thresholds[cat.key]"
                         class="thr-input form-control">
                  <span class="thr-pct">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Settings -->
        <div class="card settings-card">
          <div class="card-header"><h2>📤 Upload Settings</h2></div>
          <div class="settings-body">
            <div class="form-group">
              <label>Max File Size (MB)</label>
              <input type="number" class="form-control" [(ngModel)]="settings.maxFileSizeMB" min="1" max="2000">
            </div>
            <div class="form-group">
              <label>Data Retention (days)</label>
              <input type="number" class="form-control" [(ngModel)]="settings.retentionDays" min="1" max="365">
              <span class="hint">Results older than this will be automatically purged.</span>
            </div>
            <div class="toggle-row">
              <div class="toggle-info">
                <strong>Alert on Upload Complete</strong>
                <p>Show a notification when analysis finishes.</p>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="settings.alertOnUpload">
                <span class="toggle-knob"></span>
              </label>
            </div>
            <div class="toggle-row">
              <div class="toggle-info">
                <strong>Auto-Export Reports</strong>
                <p>Automatically download a PDF report after each analysis.</p>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="settings.autoExportReports">
                <span class="toggle-knob"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Notification Settings -->
        <div class="card settings-card">
          <div class="card-header"><h2>🔔 Notifications</h2></div>
          <div class="settings-body">
            <div class="toggle-row">
              <div class="toggle-info">
                <strong>Email Notifications</strong>
                <p>Send alerts to the email below when critical incidents are detected.</p>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="settings.emailNotifications">
                <span class="toggle-knob"></span>
              </label>
            </div>
            <div class="form-group" *ngIf="settings.emailNotifications">
              <label>Notification Email</label>
              <input type="email" class="form-control" [(ngModel)]="settings.notificationEmail"
                     placeholder="alerts@example.com">
            </div>
          </div>
        </div>

      </div>

      <!-- Actions -->
      <div class="settings-actions">
        <button class="btn btn-ghost" (click)="reset()">↺ Reset to Defaults</button>
        <div class="save-area">
          <span class="save-msg" *ngIf="saved">✅ Settings saved!</span>
          <button class="btn btn-primary" (click)="save()">💾 Save Settings</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .settings-card { }
    .settings-body { display: flex; flex-direction: column; gap: 18px; }
    .section-desc { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px; }
    .hint { font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; display: block; }

    .lang-chips { }
    .chip-label { font-size: 0.82rem; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: .5px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      padding: 4px 14px; border-radius: 20px; font-size: 0.8rem;
      background: var(--surface2); border: 1.5px solid var(--border);
      color: var(--text-secondary); cursor: pointer; transition: all .2s;
      &:hover { border-color: var(--primary); color: var(--primary); }
      &.chip-active { background: var(--primary-bg); border-color: var(--primary); color: var(--primary); font-weight: 700; }
    }

    .threshold-list { display: flex; flex-direction: column; gap: 14px; }
    .threshold-row { display: grid; grid-template-columns: 130px 1fr 90px; align-items: center; gap: 12px; }
    .thr-label { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); }
    .thr-icon { font-size: 1rem; }
    .thr-slider-wrap { position: relative; height: 8px; }
    .thr-slider {
      position: absolute; top: 0; left: 0; width: 100%; height: 8px; opacity: 0; z-index: 2; cursor: pointer;
    }
    .thr-track-fill {
      position: absolute; top: 0; left: 0; height: 8px;
      border-radius: 4px; pointer-events: none; transition: width .2s;
    }
    .thr-slider-wrap { background: var(--border); border-radius: 4px; }
    .thr-value-wrap { display: flex; align-items: center; gap: 4px; }
    .thr-input { width: 58px; text-align: center; padding: 6px; }
    .thr-pct { font-size: 0.85rem; color: var(--text-muted); }

    .toggle-row {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 12px 14px; background: var(--surface2); border-radius: 10px; border: 1px solid var(--border);
    }
    .toggle-info { strong { display: block; font-size: 0.9rem; color: var(--text-primary); } p { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; } }
    .toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-knob {
      position: absolute; inset: 0; background: var(--border); border-radius: 12px; cursor: pointer; transition: .3s;
      &::before {
        content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%;
        left: 3px; top: 3px; background: white; transition: .3s;
        box-shadow: 0 1px 3px rgba(0,0,0,.2);
      }
    }
    .toggle input:checked + .toggle-knob { background: var(--primary); }
    .toggle input:checked + .toggle-knob::before { transform: translateX(20px); }

    .settings-actions {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 24px; padding: 16px 20px;
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); box-shadow: var(--shadow);
    }
    .save-area { display: flex; align-items: center; gap: 16px; }
    .save-msg { font-size: 0.9rem; color: var(--success); font-weight: 600; }

    @media (max-width: 900px) { .settings-layout { grid-template-columns: 1fr; } }
  `]
})
export class SettingsComponent implements OnInit {
  settings!: AppSettings;
  saved = false;
  alertCats = ALERT_CATEGORIES.filter(c => c.key !== 'clean');

  constructor(private svc: SettingsService) {}

  ngOnInit() { this.settings = this.svc.get(); }

  save() {
    this.svc.save(this.settings);
    this.saved = true;
    setTimeout(() => this.saved = false, 3000);
  }

  reset() {
    this.svc.reset();
    this.settings = this.svc.get();
  }
}
