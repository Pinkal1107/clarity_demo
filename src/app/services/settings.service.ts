import { Injectable } from '@angular/core';
import { AppSettings } from '../models/clarity.models';

const DEFAULT_SETTINGS: AppSettings = {
  languages: ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Hindi', 'Mandarin'],
  defaultLanguage: 'English',
  thresholds: {
    hate_speech: 70,
    harassment: 65,
    threat: 60,
    profanity: 80,
    self_harm: 55,
    violence: 60,
  } as Record<string, number>,
  alertOnUpload: true,
  autoExportReports: false,
  maxFileSizeMB: 500,
  retentionDays: 90,
  emailNotifications: false,
  notificationEmail: '',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settings: AppSettings;

  constructor() {
    const stored = localStorage.getItem('cg_settings');
    this.settings = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
  }

  get(): AppSettings { return { ...this.settings }; }

  save(updated: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...updated };
    localStorage.setItem('cg_settings', JSON.stringify(this.settings));
  }

  reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    localStorage.removeItem('cg_settings');
  }
}
