import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../services/store.service';
import { MockDataService } from '../../services/mock-data.service';
import { ExportService } from '../../services/export.service';
import { InsightStats, ALERT_CATEGORIES } from '../../models/clarity.models';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-content fade-in">
      <div class="page-header">
        <h1>Insights Dashboard</h1>
        <p>Analytics and trends across all analyzed files.</p>
      </div>

      <!-- KPI Row -->
      <div class="grid-4">
        <div class="stat-card primary">
          <div class="stat-label">Files Analyzed</div>
          <div class="stat-value">{{ stats?.totalFilesAnalyzed || 0 }}</div>
          <div class="stat-sub">total uploaded</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">Total Incidents</div>
          <div class="stat-value">{{ stats?.totalIncidents || 0 }}</div>
          <div class="stat-sub">detected events</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Clean Files</div>
          <div class="stat-value">{{ stats?.cleanFiles || 0 }}</div>
          <div class="stat-sub">no alerts found</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg Risk Score</div>
          <div class="stat-value primary">{{ stats?.averageRiskScore || 0 }}</div>
          <div class="stat-sub">out of 100</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid-2" style="margin-top:20px">
        <!-- Incidents Over Time -->
        <div class="card chart-card">
          <div class="card-header">
            <h2>📈 Incidents Over Time (7 days)</h2>
            <button class="btn btn-outline btn-sm" (click)="exportPDF()">📄 PDF</button>
          </div>
          <div class="bar-chart-wrap">
            <div class="bar-chart" *ngIf="stats">
              <div *ngFor="let d of stats.byDate" class="bar-col">
                <div class="bar-fill" [style.height.%]="getBarPct(d.incidents)"
                     [class.bar-high]="d.incidents > 10">
                  <span class="bar-val" *ngIf="d.incidents > 0">{{ d.incidents }}</span>
                </div>
                <span class="bar-label">{{ d.date }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Distribution -->
        <div class="card chart-card">
          <div class="card-header">
            <h2>🎯 Incidents by Category</h2>
            <button class="btn btn-outline btn-sm" (click)="exportCSV()">⬇ CSV</button>
          </div>
          <div class="cat-chart" *ngIf="stats">
            <div *ngFor="let c of alertCats" class="cat-row">
              <span class="cat-name">{{ c.label }}</span>
              <div class="cat-bar-wrap">
                <div class="cat-bar-fill" [style.width.%]="getCatPct(c.key)"
                     [ngClass]="'cat-' + c.key"></div>
              </div>
              <span class="cat-count">{{ stats.byCategory[c.key] || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Second Row -->
      <div class="grid-2" style="margin-top:20px">
        <!-- Severity Donut (CSS) -->
        <div class="card chart-card">
          <div class="card-header"><h2>⚠️ Incidents by Severity</h2></div>
          <div class="sev-breakdown" *ngIf="stats">
            <div *ngFor="let sev of severities" class="sev-row">
              <span class="sev-dot" [ngClass]="'sev-' + sev"></span>
              <span class="sev-label">{{ sev | titlecase }}</span>
              <div class="sev-bar-wrap">
                <div class="sev-bar-fill" [style.width.%]="getSevPct(sev)" [ngClass]="'sev-' + sev"></div>
              </div>
              <span class="sev-count">{{ stats.bySeverity[sev] || 0 }}</span>
              <span class="sev-pct">({{ getSevPct(sev).toFixed(0) }}%)</span>
            </div>
          </div>
        </div>

        <!-- Top Languages -->
        <div class="card chart-card">
          <div class="card-header"><h2>🌐 Top Languages</h2></div>
          <div class="lang-list" *ngIf="stats">
            <div *ngFor="let l of stats.topLanguages" class="lang-row">
              <span class="lang-name">{{ l.language }}</span>
              <div class="lang-bar-wrap">
                <div class="lang-bar-fill"
                     [style.width.%]="getLangPct(l.count)"></div>
              </div>
              <span class="lang-count">{{ l.count }} files</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Risk Distribution Canvas -->
      <div class="card" style="margin-top:20px">
        <div class="card-header"><h2>📊 Risk Score Distribution</h2></div>
        <canvas #riskCanvas class="risk-canvas"></canvas>
      </div>
    </div>
  `,
  styles: [`
    .grid-4 { margin-bottom: 0; }
    .chart-card { }

    /* Bar Chart */
    .bar-chart-wrap { height: 160px; display: flex; align-items: flex-end; padding: 0 8px; }
    .bar-chart { display: flex; align-items: flex-end; gap: 8px; width: 100%; height: 100%; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
    .bar-fill {
      width: 100%; border-radius: 4px 4px 0 0; background: var(--primary);
      min-height: 4px; position: relative; display: flex; align-items: flex-start; justify-content: center;
      transition: height .4s ease;
      &.bar-high { background: var(--alert-red); }
    }
    .bar-val { font-size: 0.68rem; font-weight: 700; color: white; margin-top: 3px; }
    .bar-label { font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; text-align: center; }

    /* Category Chart */
    .cat-chart { display: flex; flex-direction: column; gap: 10px; }
    .cat-row { display: grid; grid-template-columns: 110px 1fr 30px; align-items: center; gap: 10px; }
    .cat-name { font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; }
    .cat-bar-wrap { height: 10px; background: var(--border); border-radius: 5px; overflow: hidden; }
    .cat-bar-fill { height: 100%; border-radius: 5px; transition: width .5s ease; }
    .cat-count { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); text-align: right; }

    /* Category bar colors using global cat classes applied to fill */
    .cat-bar-fill.cat-hate_speech { background: #e53935; }
    .cat-bar-fill.cat-harassment  { background: #e91e63; }
    .cat-bar-fill.cat-threat      { background: #b71c1c; }
    .cat-bar-fill.cat-profanity   { background: #ff7043; }
    .cat-bar-fill.cat-self_harm   { background: #7b1fa2; }
    .cat-bar-fill.cat-violence    { background: #d32f2f; }

    /* Severity */
    .sev-breakdown { display: flex; flex-direction: column; gap: 14px; }
    .sev-row { display: grid; grid-template-columns: 10px 80px 1fr 30px 46px; align-items: center; gap: 10px; }
    .sev-dot { width: 10px; height: 10px; border-radius: 50%; }
    .sev-dot.sev-critical { background: var(--alert-red-dark); }
    .sev-dot.sev-high { background: #e53935; }
    .sev-dot.sev-medium { background: var(--warning); }
    .sev-dot.sev-low { background: var(--success); }
    .sev-label { font-size: 0.85rem; color: var(--text-secondary); }
    .sev-bar-wrap { height: 10px; background: var(--border); border-radius: 5px; overflow: hidden; }
    .sev-bar-fill { height: 100%; border-radius: 5px; transition: width .5s; }
    .sev-bar-fill.sev-critical { background: var(--alert-red-dark); }
    .sev-bar-fill.sev-high { background: #e53935; }
    .sev-bar-fill.sev-medium { background: var(--warning); }
    .sev-bar-fill.sev-low { background: var(--success); }
    .sev-count { font-size: 0.82rem; font-weight: 700; text-align: right; }
    .sev-pct { font-size: 0.75rem; color: var(--text-muted); }

    /* Languages */
    .lang-list { display: flex; flex-direction: column; gap: 14px; }
    .lang-row { display: grid; grid-template-columns: 90px 1fr 70px; align-items: center; gap: 10px; }
    .lang-name { font-size: 0.85rem; color: var(--text-secondary); }
    .lang-bar-wrap { height: 10px; background: var(--border); border-radius: 5px; overflow: hidden; }
    .lang-bar-fill { height: 100%; background: var(--primary); border-radius: 5px; transition: width .5s; }
    .lang-count { font-size: 0.82rem; color: var(--text-muted); text-align: right; }

    .risk-canvas { width: 100%; height: 80px; display: block; }
  `]
})
export class InsightsComponent implements OnInit, AfterViewInit {
  @ViewChild('riskCanvas') riskCanvas!: ElementRef<HTMLCanvasElement>;

  stats: InsightStats | null = null;
  severities = ['critical', 'high', 'medium', 'low'];
  alertCats = ALERT_CATEGORIES.filter(c => c.key !== 'clean');
  private maxDateVal = 1;

  constructor(
    private store: StoreService,
    private mock: MockDataService,
    private export_: ExportService
  ) {}

  ngOnInit() {
    this.store.results$.subscribe(results => {
      this.stats = this.mock.getInsightStats(results);
      this.maxDateVal = Math.max(1, ...this.stats.byDate.map(d => d.incidents));
      setTimeout(() => this.drawRiskCanvas(), 100);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.drawRiskCanvas(), 150);
  }

  drawRiskCanvas() {
    if (!this.riskCanvas || !this.stats) return;
    const canvas = this.riskCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#43a047');
    gradient.addColorStop(0.5, '#fb8c00');
    gradient.addColorStop(1, '#e53935');

    ctx.fillStyle = '#f0f4ff';
    ctx.fillRect(0, 0, w, h);

    // Draw distribution bars
    const buckets = 20;
    const bucketW = w / buckets;
    for (let i = 0; i < buckets; i++) {
      const h2 = Math.random() * h * 0.7 + h * 0.1;
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.roundRect(i * bucketW + 1, h - h2, bucketW - 2, h2, 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  getBarPct(val: number): number { return (val / this.maxDateVal) * 100; }

  getCatPct(key: string): number {
    if (!this.stats) return 0;
    const max = Math.max(1, ...Object.values(this.stats.byCategory));
    return ((this.stats.byCategory[key] || 0) / max) * 100;
  }

  getSevPct(sev: string): number {
    if (!this.stats) return 0;
    const total = Object.values(this.stats.bySeverity).reduce((a, b) => a + b, 0);
    return total ? ((this.stats.bySeverity[sev] || 0) / total) * 100 : 0;
  }

  getLangPct(count: number): number {
    if (!this.stats) return 0;
    const max = Math.max(1, ...this.stats.topLanguages.map(l => l.count));
    return (count / max) * 100;
  }

  exportCSV() {
    if (this.stats) this.export_.exportResultsCSV(this.store.getResults());
  }
  exportPDF() {
    if (this.stats) this.export_.exportInsightsPDF(this.stats);
  }
}
