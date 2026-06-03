import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AnalysisResult, Incident, UploadFile } from '../models/clarity.models';
import { MockDataService } from './mock-data.service';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private _results = new BehaviorSubject<AnalysisResult[]>([]);
  private _incidents = new BehaviorSubject<Incident[]>([]);
  private _uploads = new BehaviorSubject<UploadFile[]>([]);

  results$ = this._results.asObservable();
  incidents$ = this._incidents.asObservable();
  uploads$ = this._uploads.asObservable();

  constructor(private mock: MockDataService) {
    this.seedDemoData();
  }

  private seedDemoData() {
    const demoFiles: UploadFile[] = [
      { id: 'demo-1', file: null!, name: 'board_meeting_recording.mp4', size: 52428800, type: 'video/mp4', progress: 100, status: 'done', duration: 1823, uploadedAt: new Date(Date.now() - 86400000 * 2) },
      { id: 'demo-2', file: null!, name: 'customer_call_may28.mp3', size: 12582912, type: 'audio/mp3', progress: 100, status: 'done', duration: 412, uploadedAt: new Date(Date.now() - 86400000) },
      { id: 'demo-3', file: null!, name: 'team_standup_clip.wav', size: 8388608, type: 'audio/wav', progress: 100, status: 'done', duration: 187, uploadedAt: new Date(Date.now() - 3600000) },
    ];
    const results = demoFiles.map(f => this.mock.buildAnalysisResult(f));
    this._results.next(results);
    this._incidents.next(this.mock.resultsToIncidents(results));
  }

  addResult(result: AnalysisResult) {
    const current = this._results.value;
    const updated = [result, ...current];
    this._results.next(updated);
    const newIncidents = this.mock.resultsToIncidents([result]);
    this._incidents.next([...newIncidents, ...this._incidents.value]);
  }

  updateIncidentStatus(id: string, status: 'open' | 'reviewed' | 'dismissed', notes?: string) {
    const updated = this._incidents.value.map(inc =>
      inc.id === id ? { ...inc, status, notes: notes ?? inc.notes } : inc
    );
    this._incidents.next(updated);
  }

  getResults() { return this._results.value; }
  getIncidents() { return this._incidents.value; }
}
