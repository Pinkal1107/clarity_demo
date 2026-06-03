import { Component, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UploadFile } from '../../models/clarity.models';
import { MockDataService } from '../../services/mock-data.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-content fade-in">
      <div class="page-header">
        <h1>Upload Audio / Video Files</h1>
        <p>Drag & drop or browse files to begin AI-powered harmful speech detection.</p>
      </div>

      <!-- Drop Zone -->
      <div class="card drop-zone"
           [class.dragover]="isDragging"
           (dragover)="onDragOver($event)"
           (dragleave)="isDragging = false"
           (drop)="onDrop($event)"
           (click)="fileInput.click()">
        <input #fileInput type="file" multiple accept="audio/*,video/*" hidden (change)="onFileSelect($event)">
        <div class="dz-inner">
          <div class="dz-icon">{{ isDragging ? '⬇️' : '📁' }}</div>
          <p class="dz-text">Drag &amp; drop audio/video files here</p>
          <p class="dz-sub">or <span class="link">browse files</span> — MP3, MP4, WAV, M4A, FLAC, OGG, WEBM</p>
          <p class="dz-limit">Max 500 MB per file • Multiple files supported</p>
        </div>
      </div>

      <!-- File Queue -->
      <div class="card queue-card" *ngIf="queue.length > 0">
        <div class="card-header">
          <h2>Upload Queue ({{ queue.length }} file{{ queue.length !== 1 ? 's' : '' }})</h2>
          <div class="queue-actions">
            <button class="btn btn-ghost btn-sm" (click)="clearDone()">Clear Done</button>
            <button class="btn btn-primary btn-sm" [disabled]="isProcessing" (click)="analyzeAll()">
              {{ isProcessing ? '⏳ Analyzing…' : '▶ Analyze All' }}
            </button>
          </div>
        </div>

        <div class="file-list">
          <div class="file-row fade-in" *ngFor="let f of queue; trackBy: trackById">
            <div class="file-icon">{{ getFileIcon(f.type) }}</div>
            <div class="file-meta">
              <div class="file-name">{{ f.name }}</div>
              <div class="file-info">{{ formatSize(f.size) }} • {{ f.type || 'unknown' }}</div>
              <div class="progress-bar-wrap" style="margin-top:6px">
                <div class="progress-bar-fill"
                     [class.error]="f.status === 'error'"
                     [class.done]="f.status === 'done'"
                     [style.width.%]="f.progress"></div>
              </div>
            </div>
            <div class="file-status">
              <span class="status-badge" [ngClass]="'s-' + f.status">
                {{ statusLabel(f.status) }}
              </span>
              <span class="prog-pct">{{ f.progress }}%</span>
            </div>
            <button class="remove-btn" (click)="removeFile(f.id)" [disabled]="f.status === 'uploading' || f.status === 'analyzing'">✕</button>
          </div>
        </div>
      </div>

      <!-- Tips -->
      <div class="grid-3">
        <div class="tip-card" *ngFor="let tip of tips">
          <div class="tip-icon">{{ tip.icon }}</div>
          <div class="tip-text">
            <strong>{{ tip.title }}</strong>
            <p>{{ tip.body }}</p>
          </div>
        </div>
      </div>

      <!-- Supported Formats -->
      <div class="card formats-card">
        <div class="card-header"><h2>Supported Formats</h2></div>
        <div class="format-grid">
          <div class="format-pill" *ngFor="let fmt of formats">{{ fmt }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drop-zone {
      border: 2.5px dashed var(--border); cursor: pointer;
      transition: all .25s; text-align: center; padding: 48px 32px;
      &:hover, &.dragover {
        border-color: var(--primary); background: var(--primary-bg);
        transform: translateY(-2px); box-shadow: var(--shadow-md);
      }
    }
    .dz-inner { pointer-events: none; }
    .dz-icon { font-size: 3.5rem; margin-bottom: 12px; }
    .dz-text { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); }
    .dz-sub  { font-size: 0.9rem; color: var(--text-secondary); margin-top: 6px; }
    .dz-limit { font-size: 0.78rem; color: var(--text-muted); margin-top: 8px; }
    .link { color: var(--primary); font-weight: 600; }

    .queue-card { margin-top: 20px; }
    .queue-actions { display: flex; gap: 10px; }
    .file-list { display: flex; flex-direction: column; gap: 10px; }
    .file-row {
      display: grid; grid-template-columns: 40px 1fr auto 32px;
      align-items: center; gap: 14px; padding: 12px 14px;
      background: var(--surface2); border-radius: 10px; border: 1px solid var(--border);
    }
    .file-icon { font-size: 1.6rem; text-align: center; }
    .file-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); word-break: break-all; }
    .file-info { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
    .file-status { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .prog-pct { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
    .remove-btn { background: none; border: none; color: var(--text-muted); font-size: 1rem; padding: 4px; border-radius: 4px; &:hover { color: var(--alert-red); background: var(--alert-red-light); } &:disabled { opacity: .3; cursor: not-allowed; } }

    .status-badge {
      padding: 2px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      &.s-queued    { background: #e3f2fd; color: #1565c0; }
      &.s-uploading { background: #fff3e0; color: #e65100; }
      &.s-analyzing { background: #f3e5f5; color: #6a1b9a; }
      &.s-done      { background: #e8f5e9; color: #2e7d32; }
      &.s-error     { background: var(--alert-red-light); color: var(--alert-red-dark); }
    }

    .tip-card {
      display: flex; gap: 14px; align-items: flex-start;
      background: var(--surface); padding: 18px 20px; border-radius: var(--radius-lg);
      border: 1px solid var(--border); box-shadow: var(--shadow); margin-top: 20px;
      .tip-icon { font-size: 1.8rem; }
      strong { display: block; font-size: 0.9rem; color: var(--text-primary); margin-bottom: 4px; }
      p { font-size: 0.82rem; color: var(--text-secondary); }
    }

    .formats-card { margin-top: 20px; }
    .format-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .format-pill {
      background: var(--primary-bg); color: var(--primary); border: 1px solid var(--border);
      padding: 5px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
    }
  `]
})
export class UploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;

  isDragging = false;
  isProcessing = false;
  queue: UploadFile[] = [];

  formats = ['MP3', 'MP4', 'WAV', 'M4A', 'FLAC', 'OGG', 'WEBM', 'AAC', 'WMA', 'AVI', 'MOV', 'MKV'];

  tips = [
    { icon: '🎯', title: 'High Accuracy', body: 'AI analyzes context and tone for 95%+ detection accuracy across 40+ languages.' },
    { icon: '⚡', title: 'Fast Processing', body: 'Real-time analysis — a 1-hour audio file typically completes in under 2 minutes.' },
    { icon: '📋', title: 'Detailed Reports', body: 'Every flagged segment includes timestamps, transcripts, and confidence scores.' },
  ];

  constructor(private mock: MockDataService, private store: StoreService, private router: Router, private ngZone: NgZone) {}

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging = true; }

  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragging = false;
    const files = Array.from(e.dataTransfer?.files || []);
    this.addFiles(files);
  }

  onFileSelect(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    this.addFiles(files);
    (e.target as HTMLInputElement).value = '';
  }

  addFiles(files: File[]) {
    files.forEach(f => {
      const upload: UploadFile = {
        id: `up-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f, name: f.name, size: f.size, type: f.type,
        progress: 0, status: 'queued', uploadedAt: new Date(),
      };
      this.queue.push(upload);
    });
  }

  async analyzeAll() {
    const pending = this.queue.filter(f => f.status === 'queued');
    if (!pending.length) return;
    this.isProcessing = true;

    // Run all files in parallel so every progress bar animates simultaneously
    await Promise.all(
      pending.map(async f => {
        await this.simulateUpload(f);
        const result = this.mock.buildAnalysisResult(f);
        this.store.addResult(result);
      })
    );

    this.isProcessing = false;
    this.router.navigate(['/results']);
  }

  private simulateUpload(f: UploadFile): Promise<void> {
    return new Promise(resolve => {
      this.ngZone.run(() => { f.status = 'uploading'; f.progress = 0; });

      const tick = setInterval(() => {
        this.ngZone.run(() => {
          f.progress = Math.min(Math.round(f.progress + Math.random() * 12 + 6), 70);
          if (f.progress >= 70) {
            clearInterval(tick);
            f.status = 'analyzing';

            const tick2 = setInterval(() => {
              this.ngZone.run(() => {
                f.progress = Math.min(Math.round(f.progress + Math.random() * 8 + 4), 100);
                if (f.progress >= 100) {
                  clearInterval(tick2);
                  f.progress = 100;
                  f.status = 'done';
                  resolve();
                }
              });
            }, 180);
          }
        });
      }, 120);
    });
  }

  removeFile(id: string) { this.queue = this.queue.filter(f => f.id !== id); }
  clearDone() { this.queue = this.queue.filter(f => f.status !== 'done'); }
  trackById(_: number, f: UploadFile) { return f.id; }

  formatSize(bytes: number): string {
    if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  getFileIcon(type: string): string {
    if (type.startsWith('video')) return '🎬';
    if (type.startsWith('audio')) return '🎵';
    return '📄';
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      queued: 'Queued', uploading: 'Uploading', analyzing: 'Analyzing', done: 'Done', error: 'Error'
    };
    return map[s] || s;
  }
}
