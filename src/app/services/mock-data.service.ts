import { Injectable } from '@angular/core';
import {
  AnalysisResult, DetectionEvent, Incident, InsightStats,
  AlertCategory, UploadFile
} from '../models/clarity.models';

@Injectable({ providedIn: 'root' })
export class MockDataService {

  private sampleTranscripts: Record<AlertCategory, string[]> = {
    hate_speech: [
      'This group of people should not be allowed here.',
      'I hate everything about those people and their culture.',
    ],
    harassment: [
      'I will keep targeting you until you leave.',
      'Nobody likes you and everyone says so.',
    ],
    threat: [
      'You better watch your back after this.',
      'Things will get very bad for you if you continue.',
    ],
    profanity: [
      '...and that is absolute [bleep] nonsense.',
      'What the [bleep] were you thinking?',
    ],
    self_harm: [
      'I just don\'t want to be here anymore.',
      'Nobody would even notice if I was gone.',
    ],
    violence: [
      'Someone needs to teach them a real lesson physically.',
      'We should take matters into our own hands violently.',
    ],
    clean: [
      'This is a great idea and I fully support it.',
      'Let\'s work together to find the best solution.',
    ],
  };

  generateWaveform(duration: number): number[] {
    const points = Math.floor(duration * 10);
    return Array.from({ length: points }, () => Math.random() * 0.8 + 0.1);
  }

  generateEvents(duration: number): DetectionEvent[] {
    const categories: AlertCategory[] = [
      'hate_speech', 'harassment', 'threat', 'profanity', 'self_harm', 'violence'
    ];
    const severities = ['low', 'medium', 'high', 'critical'] as const;
    const count = Math.floor(Math.random() * 5) + 1;
    const events: DetectionEvent[] = [];

    for (let i = 0; i < count; i++) {
      const start = Math.random() * (duration - 5);
      const len = Math.random() * 4 + 1;
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const transcripts = this.sampleTranscripts[cat];
      events.push({
        id: `evt-${Date.now()}-${i}`,
        startTime: parseFloat(start.toFixed(2)),
        endTime: parseFloat((start + len).toFixed(2)),
        category: cat,
        confidence: parseFloat((Math.random() * 0.4 + 0.6).toFixed(2)),
        transcript: transcripts[Math.floor(Math.random() * transcripts.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
      });
    }
    return events.sort((a, b) => a.startTime - b.startTime);
  }

  buildAnalysisResult(file: UploadFile): AnalysisResult {
    const duration = Math.floor(Math.random() * 300) + 30;
    const events = this.generateEvents(duration);
    const riskScore = events.length === 0 ? 5 : Math.min(100,
      events.reduce((s, e) => s + e.confidence * 20, 0));

    const risk =
      riskScore < 20 ? 'safe' :
      riskScore < 40 ? 'low' :
      riskScore < 60 ? 'medium' :
      riskScore < 80 ? 'high' : 'critical';

    return {
      fileId: file.id,
      fileName: file.name,
      fileType: file.type,
      duration,
      uploadedAt: file.uploadedAt!,
      analyzedAt: new Date(),
      language: 'English',
      overallRisk: risk,
      riskScore: parseFloat(riskScore.toFixed(1)),
      events,
      waveformData: this.generateWaveform(duration),
      summary: `Detected ${events.length} alert(s) in ${duration}s of audio. Risk level: ${risk}.`,
    };
  }

  getInsightStats(results: AnalysisResult[]): InsightStats {
    const allEvents = results.flatMap(r => r.events);
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const categories: AlertCategory[] = [
      'hate_speech','harassment','threat','profanity','self_harm','violence','clean'
    ];
    categories.forEach(c => (byCategory[c] = 0));
    ['low','medium','high','critical'].forEach(s => (bySeverity[s] = 0));

    allEvents.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    });

    const byDate = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        incidents: Math.floor(Math.random() * 15),
      };
    });

    return {
      totalFilesAnalyzed: results.length,
      totalIncidents: allEvents.length,
      cleanFiles: results.filter(r => r.overallRisk === 'safe').length,
      flaggedFiles: results.filter(r => r.overallRisk !== 'safe').length,
      byCategory: byCategory as any,
      bySeverity,
      byDate,
      topLanguages: [
        { language: 'English', count: Math.ceil(results.length * 0.6) },
        { language: 'Spanish', count: Math.ceil(results.length * 0.2) },
        { language: 'French', count: Math.ceil(results.length * 0.1) },
        { language: 'Other', count: Math.ceil(results.length * 0.1) },
      ],
      averageRiskScore: results.length
        ? parseFloat((results.reduce((s, r) => s + r.riskScore, 0) / results.length).toFixed(1))
        : 0,
    };
  }

  resultsToIncidents(results: AnalysisResult[]): Incident[] {
    const statuses = ['open', 'reviewed', 'dismissed'] as const;
    return results.flatMap(r =>
      r.events.map(e => ({
        id: `inc-${e.id}`,
        fileId: r.fileId,
        fileName: r.fileName,
        category: e.category,
        severity: e.severity,
        timestamp: new Date(r.uploadedAt.getTime() + e.startTime * 1000),
        duration: parseFloat((e.endTime - e.startTime).toFixed(2)),
        transcript: e.transcript,
        confidence: e.confidence,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      }))
    );
  }
}
