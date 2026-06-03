import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { ExportService } from '../../services/export.service';
import { AnalysisResult, DetectionEvent, ALERT_CATEGORIES } from '../../models/clarity.models';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-content fade-in">
      <div class="page-header">
        <h1>Detection Results</h1>
        <p>AI-analyzed audio/video files with timestamps and alert breakdowns.</p>
      </div>

      <!-- File Selector -->
      <div class="card file-selector-card" *ngIf="results.length > 0">
        <div class="card-header">
          <h2>Analyzed Files ({{ results.length }})</h2>
          <button class="btn btn-outline btn-sm" (click)="exportAll()">⬇ Export CSV</button>
        </div>
        <div class="file-tabs">
          <button *ngFor="let r of results" class="file-tab"
                  [class.active]="selected?.fileId === r.fileId"
                  (click)="select(r)">
            <span>{{ getFileIcon(r.fileType) }}</span>
            <span class="tab-name">{{ r.fileName }}</span>
            <span class="badge" [ngClass]="'badge-' + r.overallRisk">{{ r.overallRisk }}</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div class="card empty-state" *ngIf="results.length === 0">
        <div class="empty-icon">📭</div>
        <p>No results yet. <a routerLink="/" class="link">Upload a file</a> to get started.</p>
      </div>

      <!-- Selected Result Detail -->
      <ng-container *ngIf="selected">
        <!-- Risk Overview -->
        <div class="grid-4" style="margin-top:20px">
          <div class="stat-card" [ngClass]="getRiskClass(selected.overallRisk)">
            <div class="stat-label">Risk Level</div>
            <div class="stat-value" [ngClass]="'risk-' + selected.overallRisk">{{ selected.overallRisk | titlecase }}</div>
            <div class="stat-sub">Score: {{ selected.riskScore }} / 100</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Duration</div>
            <div class="stat-value primary">{{ formatDur(selected.duration) }}</div>
            <div class="stat-sub">{{ selected.language }}</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-label">Alerts Found</div>
            <div class="stat-value">{{ selected.events.length }}</div>
            <div class="stat-sub">{{ selected.analyzedAt | date:'short' }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">File Type</div>
            <div class="stat-value primary" style="font-size:1.2rem">{{ getFileIcon(selected.fileType) }}</div>
            <div class="stat-sub">{{ selected.fileType }}</div>
          </div>
        </div>

        <!-- Waveform -->
        <div class="card waveform-card" style="margin-top:20px">
          <div class="card-header">
            <h2>🎵 Waveform Visualization</h2>
            <span class="wf-file-name">{{ selected.fileName }}</span>
          </div>
          <div class="waveform-wrapper">
            <canvas #waveCanvas class="waveform-canvas"></canvas>
            <div class="event-markers">
              <div *ngFor="let e of selected.events" class="event-marker"
                   [style.left.%]="(e.startTime / selected.duration) * 100"
                   [style.width.%]="((e.endTime - e.startTime) / selected.duration) * 100"
                   [ngClass]="'cat-' + e.category"
                   [attr.data-tooltip]="e.category + ' (' + formatDurSec(e.startTime) + ')'">
              </div>
            </div>
            <div class="time-labels">
              <span>0:00</span>
              <span>{{ formatDur(selected.duration / 4) }}</span>
              <span>{{ formatDur(selected.duration / 2) }}</span>
              <span>{{ formatDur(selected.duration * 3/4) }}</span>
              <span>{{ formatDur(selected.duration) }}</span>
            </div>
          </div>
          <div class="wf-legend">
            <div *ngFor="let cat of alertCats" class="wf-legend-item">
              <span class="wf-swatch" [ngClass]="'cat-' + cat.key"></span>
              <span>{{ cat.label }}</span>
            </div>
          </div>
        </div>

        <!-- Alert Events Timeline -->
        <div class="card timeline-card" style="margin-top:20px">
          <div class="card-header">
            <h2>🚨 Alert Events ({{ selected.events.length }})</h2>
            <button class="btn btn-outline btn-sm" (click)="exportEvents()">⬇ Export CSV</button>
          </div>

          <div class="empty-state" *ngIf="selected.events.length === 0">
            <div class="empty-icon">✅</div>
            <p>No harmful speech detected in this file.</p>
          </div>

          <table class="data-table" *ngIf="selected.events.length > 0">
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>Duration</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Transcript</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of selected.events; let i = index" class="evt-row"
                  [class.evt-critical]="e.severity === 'critical'">
                <td class="evt-num">{{ i + 1 }}</td>
                <td class="evt-time">
                  <span class="time-badge">{{ formatDurSec(e.startTime) }}</span>
                  <span class="time-sep">→</span>
                  <span class="time-badge">{{ formatDurSec(e.endTime) }}</span>
                </td>
                <td>{{ (e.endTime - e.startTime).toFixed(1) }}s</td>
                <td><span class="cat-badge" [ngClass]="'cat-' + e.category">{{ getCatLabel(e.category) }}</span></td>
                <td><span class="badge" [ngClass]="'badge-' + e.severity">{{ e.severity }}</span></td>
                <td>
                  <div class="conf-bar">
                    <div class="conf-fill" [style.width.%]="e.confidence * 100" [ngClass]="getConfClass(e.confidence)"></div>
                  </div>
                  <span class="conf-pct">{{ (e.confidence * 100).toFixed(0) }}%</span>
                </td>
                <td class="transcript-cell">{{ e.transcript }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="card summary-card" style="margin-top:20px">
          <div class="card-header"><h2>📝 Analysis Summary</h2></div>
          <p class="summary-text">{{ selected.summary }}</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .file-selector-card { }
    .file-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
    .file-tab {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; border-radius: 8px; border: 1.5px solid var(--border);
      background: var(--surface2); cursor: pointer; font-size: 0.85rem;
      transition: all .2s; color: var(--text-secondary);
      &:hover { border-color: var(--primary); background: var(--primary-bg); }
      &.active { border-color: var(--primary); background: var(--primary-bg); color: var(--primary); font-weight: 700; }
    }
    .tab-name { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .waveform-card .card-header { margin-bottom: 12px; }
    .wf-file-name { font-size: 0.82rem; color: var(--text-muted); }
    .waveform-wrapper { position: relative; padding-bottom: 24px; }
    .waveform-canvas { width: 100%; height: 100px; display: block; border-radius: 8px; }
    .event-markers { position: absolute; top: 0; left: 0; right: 0; height: 100px; pointer-events: none; }
    .event-marker {
      position: absolute; height: 100%; opacity: .35; border-radius: 2px; pointer-events: auto;
      &:hover { opacity: .65; }
    }
    .time-labels {
      display: flex; justify-content: space-between;
      font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;
    }
    .wf-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
    .wf-legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-secondary); }
    .wf-swatch { width: 14px; height: 14px; border-radius: 3px; display: inline-block; }

    .evt-row.evt-critical { background: #fff8f8 !important; }
    .evt-num { font-weight: 700; color: var(--text-muted); }
    .evt-time { white-space: nowrap; }
    .time-badge { background: var(--primary-bg); color: var(--primary); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-family: monospace; font-weight: 600; }
    .time-sep { color: var(--text-muted); margin: 0 4px; }
    .cat-badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
    .conf-bar { display: inline-block; width: 60px; height: 4px; background: var(--border); border-radius: 2px; vertical-align: middle; margin-right: 6px; }
    .conf-fill { height: 100%; border-radius: 2px; &.high-conf { background: var(--alert-red); } &.med-conf { background: var(--warning); } &.low-conf { background: var(--success); } }
    .conf-pct { font-size: 0.8rem; font-weight: 600; }
    .transcript-cell { max-width: 280px; font-size: 0.82rem; color: var(--text-secondary); }
    .summary-text { font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; }
    .link { color: var(--primary); font-weight: 600; }

    .cat-badge.cat-hate_speech { color: #b71c1c; background: #ffebee; }
    .cat-badge.cat-harassment  { color: #880e4f; background: #fce4ec; }
    .cat-badge.cat-threat      { color: #b71c1c; background: #fce4ec; }
    .cat-badge.cat-profanity   { color: #bf360c; background: #fbe9e7; }
    .cat-badge.cat-self_harm   { color: #4a148c; background: #ede7f6; }
    .cat-badge.cat-violence    { color: #c62828; background: #ffebee; }
    .cat-badge.cat-clean       { color: #2e7d32; background: #e8f5e9; }
  `]
})
export class ResultsComponent implements OnInit, AfterViewInit {
  @ViewChild('waveCanvas') waveCanvas!: ElementRef<HTMLCanvasElement>;

  results: AnalysisResult[] = [];
  selected: AnalysisResult | null = null;
  alertCats = ALERT_CATEGORIES.filter(c => c.key !== 'clean');

  constructor(
    private store: StoreService,
    private export_: ExportService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.store.results$.subscribe(r => {
      this.results = r;
      if (r.length > 0 && !this.selected) this.select(r[0]);
    });
  }

  ngAfterViewInit() {
    if (this.selected) setTimeout(() => this.drawWaveform(), 50);
  }

  select(r: AnalysisResult) {
    this.selected = r;
    setTimeout(() => this.drawWaveform(), 50);
  }

  drawWaveform() {
    if (!this.waveCanvas || !this.selected) return;
    const canvas = this.waveCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    const data = this.selected.waveformData;
    const barW = w / data.length;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f0f4ff';
    ctx.fillRect(0, 0, w, h);

    data.forEach((amp, i) => {
      const barH = amp * (h * 0.8);
      const x = i * barW;
      const y = (h - barH) / 2;
      const isAlert = this.selected!.events.some(e => {
        const pct = i / data.length;
        return pct >= (e.startTime / this.selected!.duration) && pct <= (e.endTime / this.selected!.duration);
      });
      ctx.fillStyle = isAlert ? '#e53935' : '#1952ba';
      ctx.globalAlpha = isAlert ? 0.85 : 0.55;
      ctx.beginPath();
      ctx.roundRect(x + 0.5, y, Math.max(barW - 1, 1), barH, 1);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  exportAll() { this.export_.exportResultsCSV(this.results); }
  exportEvents() {
    if (!this.selected) return;
    const incidents = this.selected.events.map(e => ({
      id: e.id, fileId: this.selected!.fileId, fileName: this.selected!.fileName,
      category: e.category, severity: e.severity,
      timestamp: new Date(this.selected!.uploadedAt.getTime() + e.startTime * 1000),
      duration: e.endTime - e.startTime, transcript: e.transcript,
      confidence: e.confidence, status: 'open' as any,
    }));
    this.export_.exportIncidentsCSV(incidents, `events-${this.selected.fileName}.csv`);
  }

  formatDur(sec: number): string {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  formatDurSec(sec: number): string { return this.formatDur(sec); }

  getFileIcon(type: string): string {
    if (type?.startsWith('video')) return '🎬';
    if (type?.startsWith('audio')) return '🎵';
    return '📄';
  }

  getCatLabel(key: string): string {
    return ALERT_CATEGORIES.find(c => c.key === key)?.label ?? key;
  }

  getRiskClass(risk: string): string {
    return risk === 'critical' || risk === 'high' ? 'danger' : risk === 'safe' ? 'success' : '';
  }

  getConfClass(conf: number): string {
    return conf >= 0.8 ? 'high-conf' : conf >= 0.6 ? 'med-conf' : 'low-conf';
  }
}
