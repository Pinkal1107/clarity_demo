import { Injectable } from '@angular/core';
import { AnalysisResult, Incident, InsightStats } from '../models/clarity.models';

declare const jsPDF: any;

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportIncidentsCSV(incidents: Incident[], filename = 'incidents.csv') {
    const headers = ['ID','File','Category','Severity','Timestamp','Duration(s)','Confidence(%)','Status','Transcript'];
    const rows = incidents.map(i => [
      i.id, i.fileName, i.category, i.severity,
      i.timestamp.toISOString(), i.duration,
      Math.round(i.confidence * 100), i.status,
      `"${i.transcript.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    this.downloadText(csv, filename, 'text/csv');
  }

  exportResultsCSV(results: AnalysisResult[], filename = 'analysis_results.csv') {
    const headers = ['File','Type','Duration(s)','Risk','Score','Events','Language','Analyzed At'];
    const rows = results.map(r => [
      r.fileName, r.fileType, r.duration, r.overallRisk,
      r.riskScore, r.events.length, r.language,
      r.analyzedAt.toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    this.downloadText(csv, filename, 'text/csv');
  }

  async exportIncidentsPDF(incidents: Incident[], filename = 'incident_report.pdf') {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFillColor(25, 82, 186);
    doc.rect(0, 0, 300, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('ClarityGuard — Incident Report', 14, 13);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 220, 13);

    doc.setTextColor(0, 0, 0);

    const summary = {
      total: incidents.length,
      critical: incidents.filter(i => i.severity === 'critical').length,
      open: incidents.filter(i => i.status === 'open').length,
    };

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total Incidents: ${summary.total}   |   Critical: ${summary.critical}   |   Open: ${summary.open}`, 14, 28);

    autoTable(doc, {
      startY: 33,
      head: [['File', 'Category', 'Severity', 'Timestamp', 'Confidence', 'Status', 'Transcript']],
      body: incidents.map(i => [
        i.fileName,
        i.category.replace('_', ' ').toUpperCase(),
        i.severity.toUpperCase(),
        i.timestamp.toLocaleString(),
        `${Math.round(i.confidence * 100)}%`,
        i.status.toUpperCase(),
        i.transcript.substring(0, 60) + (i.transcript.length > 60 ? '…' : ''),
      ]),
      headStyles: { fillColor: [25, 82, 186], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 245, 255] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 6: { cellWidth: 70 } },
    });

    doc.save(filename);
  }

  async exportInsightsPDF(stats: InsightStats, filename = 'insights_report.pdf') {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();

    doc.setFillColor(25, 82, 186);
    doc.rect(0, 0, 220, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('ClarityGuard — Insights Report', 14, 13);
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text('Summary Statistics', 14, 30);

    autoTable(doc, {
      startY: 34,
      head: [['Metric', 'Value']],
      body: [
        ['Total Files Analyzed', stats.totalFilesAnalyzed],
        ['Total Incidents', stats.totalIncidents],
        ['Clean Files', stats.cleanFiles],
        ['Flagged Files', stats.flaggedFiles],
        ['Average Risk Score', `${stats.averageRiskScore} / 100`],
      ],
      headStyles: { fillColor: [25, 82, 186] },
      styles: { fontSize: 9 },
    });

    doc.setFontSize(11);
    doc.text('Incidents by Category', 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 14,
      head: [['Category', 'Count']],
      body: Object.entries(stats.byCategory).map(([k, v]) => [k.replace('_', ' ').toUpperCase(), v]),
      headStyles: { fillColor: [25, 82, 186] },
      styles: { fontSize: 9 },
    });

    doc.save(filename);
  }

  private downloadText(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
