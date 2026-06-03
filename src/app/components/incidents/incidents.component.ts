import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../services/store.service';
import { ExportService } from '../../services/export.service';
import { Incident, AlertCategory, ALERT_CATEGORIES } from '../../models/clarity.models';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-content fade-in">
      <div class="page-header">
        <h1>Incident Reports</h1>
        <p>All detected harmful speech events across uploaded files.</p>
      </div>

      <!-- Stats Row -->
      <div class="grid-4">
        <div class="stat-card danger">
          <div class="stat-label">Total Incidents</div>
          <div class="stat-value">{{ incidents.length }}</div>
          <div class="stat-sub">all time</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">Open</div>
          <div class="stat-value">{{ countStatus('open') }}</div>
          <div class="stat-sub">needs review</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Reviewed</div>
          <div class="stat-value">{{ countStatus('reviewed') }}</div>
          <div class="stat-sub">resolved</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Critical</div>
          <div class="stat-value primary">{{ countSeverity('critical') }}</div>
          <div class="stat-sub">high priority</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filters-card">
        <div class="filters-row">
          <div class="form-group">
            <label>Search</label>
            <input class="form-control" placeholder="Search file, transcript…" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
          </div>
          <div class="form-group">
            <label>Category</label>
            <select class="form-control" [(ngModel)]="filterCat" (ngModelChange)="applyFilters()">
              <option value="">All Categories</option>
              <option *ngFor="let c of alertCats" [value]="c.key">{{ c.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Severity</label>
            <select class="form-control" [(ngModel)]="filterSev" (ngModelChange)="applyFilters()">
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="form-control" [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <div class="filter-actions">
            <button class="btn btn-ghost btn-sm" (click)="resetFilters()">↺ Reset</button>
            <button class="btn btn-outline btn-sm" (click)="exportCSV()">⬇ CSV</button>
            <button class="btn btn-primary btn-sm" (click)="exportPDF()">📄 PDF</button>
          </div>
        </div>
        <div class="filter-summary">
          Showing <strong>{{ filtered.length }}</strong> of {{ incidents.length }} incidents
        </div>
      </div>

      <!-- Incidents Table -->
      <div class="card table-card">
        <div class="empty-state" *ngIf="filtered.length === 0">
          <div class="empty-icon">🔍</div>
          <p>No incidents match your filters.</p>
        </div>

        <div class="table-wrapper" *ngIf="filtered.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Detected At</th>
                <th>Duration</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Transcript</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inc of paginated; trackBy: trackById"
                  [class.row-critical]="inc.severity === 'critical'">
                <td class="file-cell">
                  <span class="file-name-short" [title]="inc.fileName">{{ inc.fileName }}</span>
                </td>
                <td>
                  <span class="cat-pill" [ngClass]="'cat-' + inc.category">
                    {{ getCatLabel(inc.category) }}
                  </span>
                </td>
                <td><span class="badge" [ngClass]="'badge-' + inc.severity">{{ inc.severity }}</span></td>
                <td class="ts-cell">{{ inc.timestamp | date:'MMM d, h:mm a' }}</td>
                <td>{{ inc.duration.toFixed(1) }}s</td>
                <td>
                  <div class="conf-wrap">
                    <div class="mini-bar"><div class="mini-fill" [style.width.%]="inc.confidence * 100"></div></div>
                    {{ (inc.confidence * 100).toFixed(0) }}%
                  </div>
                </td>
                <td><span class="badge" [ngClass]="'badge-' + inc.status">{{ inc.status }}</span></td>
                <td class="transcript-cell" [title]="inc.transcript">{{ inc.transcript }}</td>
                <td class="actions-cell">
                  <button class="action-btn" *ngIf="inc.status !== 'reviewed'" (click)="markStatus(inc.id, 'reviewed')" data-tooltip="Mark Reviewed">✅</button>
                  <button class="action-btn" *ngIf="inc.status !== 'dismissed'" (click)="markStatus(inc.id, 'dismissed')" data-tooltip="Dismiss">🚫</button>
                  <button class="action-btn" *ngIf="inc.status !== 'open'" (click)="markStatus(inc.id, 'open')" data-tooltip="Reopen">🔄</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination">
            <button class="btn btn-ghost btn-sm" [disabled]="page === 0" (click)="page = page - 1">‹ Prev</button>
            <span class="page-info">Page {{ page + 1 }} of {{ totalPages }}</span>
            <button class="btn btn-ghost btn-sm" [disabled]="page >= totalPages - 1" (click)="page = page + 1">Next ›</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid-4 { margin-bottom: 20px; }
    .filters-card { margin-bottom: 20px; }
    .filters-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; }
    .form-group { flex: 1; min-width: 140px; }
    .filter-actions { display: flex; gap: 8px; align-items: flex-end; padding-bottom: 0; }
    .filter-summary { margin-top: 10px; font-size: 0.82rem; color: var(--text-muted); }

    .table-wrapper { overflow-x: auto; }
    .table-card { padding: 0; overflow: hidden; }
    .data-table { min-width: 900px; }
    tr.row-critical { background: #fff8f8 !important; }

    .file-cell .file-name-short { max-width: 130px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem; }
    .cat-pill { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
    .ts-cell { white-space: nowrap; font-size: 0.82rem; }
    .conf-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; }
    .mini-bar { width: 48px; height: 4px; background: var(--border); border-radius: 2px; }
    .mini-fill { height: 100%; background: var(--primary); border-radius: 2px; }
    .transcript-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8rem; color: var(--text-secondary); }
    .actions-cell { white-space: nowrap; }
    .action-btn { background: none; border: none; font-size: 1rem; padding: 3px 5px; border-radius: 4px; cursor: pointer; &:hover { background: var(--surface2); } }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid var(--border); }
    .page-info { font-size: 0.85rem; color: var(--text-secondary); }

    .cat-pill.cat-hate_speech { color: #b71c1c; background: #ffebee; }
    .cat-pill.cat-harassment  { color: #880e4f; background: #fce4ec; }
    .cat-pill.cat-threat      { color: #b71c1c; background: #fce4ec; }
    .cat-pill.cat-profanity   { color: #bf360c; background: #fbe9e7; }
    .cat-pill.cat-self_harm   { color: #4a148c; background: #ede7f6; }
    .cat-pill.cat-violence    { color: #c62828; background: #ffebee; }
    .cat-pill.cat-clean       { color: #2e7d32; background: #e8f5e9; }
  `]
})
export class IncidentsComponent implements OnInit {
  incidents: Incident[] = [];
  filtered: Incident[] = [];
  alertCats = ALERT_CATEGORIES.filter(c => c.key !== 'clean');

  searchTerm = '';
  filterCat = '';
  filterSev = '';
  filterStatus = '';
  page = 0;
  pageSize = 15;

  constructor(private store: StoreService, private export_: ExportService) {}

  ngOnInit() {
    this.store.incidents$.subscribe(i => {
      this.incidents = i;
      this.applyFilters();
    });
  }

  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get paginated() { return this.filtered.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize); }

  applyFilters() {
    this.page = 0;
    this.filtered = this.incidents.filter(i => {
      const s = this.searchTerm.toLowerCase();
      if (s && !i.fileName.toLowerCase().includes(s) && !i.transcript.toLowerCase().includes(s)) return false;
      if (this.filterCat && i.category !== this.filterCat) return false;
      if (this.filterSev && i.severity !== this.filterSev) return false;
      if (this.filterStatus && i.status !== this.filterStatus) return false;
      return true;
    });
  }

  resetFilters() {
    this.searchTerm = ''; this.filterCat = ''; this.filterSev = ''; this.filterStatus = '';
    this.applyFilters();
  }

  countStatus(s: string) { return this.incidents.filter(i => i.status === s).length; }
  countSeverity(s: string) { return this.incidents.filter(i => i.severity === s).length; }

  markStatus(id: string, status: 'open' | 'reviewed' | 'dismissed') {
    this.store.updateIncidentStatus(id, status);
  }

  exportCSV() { this.export_.exportIncidentsCSV(this.filtered); }
  exportPDF() { this.export_.exportIncidentsPDF(this.filtered); }

  getCatLabel(key: string): string {
    return ALERT_CATEGORIES.find(c => c.key === key)?.label ?? key;
  }

  trackById(_: number, inc: Incident) { return inc.id; }
}
