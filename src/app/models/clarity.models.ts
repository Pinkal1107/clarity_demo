export type AlertCategory =
  | 'hate_speech'
  | 'harassment'
  | 'threat'
  | 'profanity'
  | 'self_harm'
  | 'violence'
  | 'clean';

export interface AlertCategoryMeta {
  key: AlertCategory;
  label: string;
  color: string;
  icon: string;
}

export const ALERT_CATEGORIES: AlertCategoryMeta[] = [
  { key: 'hate_speech', label: 'Hate Speech', color: '#e53935', icon: '🚫' },
  { key: 'harassment', label: 'Harassment', color: '#f44336', icon: '⚠️' },
  { key: 'threat', label: 'Threat', color: '#b71c1c', icon: '🔴' },
  { key: 'profanity', label: 'Profanity', color: '#ff7043', icon: '🔶' },
  { key: 'self_harm', label: 'Self Harm', color: '#c62828', icon: '🆘' },
  { key: 'violence', label: 'Violence', color: '#d32f2f', icon: '⛔' },
  { key: 'clean', label: 'Clean', color: '#43a047', icon: '✅' },
];

export interface DetectionEvent {
  id: string;
  startTime: number;   // seconds
  endTime: number;     // seconds
  category: AlertCategory;
  confidence: number;  // 0–1
  transcript: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'queued' | 'uploading' | 'analyzing' | 'done' | 'error';
  duration?: number;
  uploadedAt?: Date;
}

export interface AnalysisResult {
  fileId: string;
  fileName: string;
  fileType: string;
  duration: number;
  uploadedAt: Date;
  analyzedAt: Date;
  language: string;
  overallRisk: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;       // 0–100
  events: DetectionEvent[];
  waveformData: number[];  // amplitude data points
  summary: string;
}

export interface Incident {
  id: string;
  fileId: string;
  fileName: string;
  category: AlertCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  duration: number;
  transcript: string;
  confidence: number;
  status: 'open' | 'reviewed' | 'dismissed';
  notes?: string;
}

export interface InsightStats {
  totalFilesAnalyzed: number;
  totalIncidents: number;
  cleanFiles: number;
  flaggedFiles: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byDate: { date: string; incidents: number }[];
  topLanguages: { language: string; count: number }[];
  averageRiskScore: number;
}

export interface AppSettings {
  languages: string[];
  defaultLanguage: string;
  thresholds: Record<string, number>;
  alertOnUpload: boolean;
  autoExportReports: boolean;
  maxFileSizeMB: number;
  retentionDays: number;
  emailNotifications: boolean;
  notificationEmail: string;
}
