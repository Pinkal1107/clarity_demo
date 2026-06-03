import { Routes } from '@angular/router';
import { UploadComponent } from './components/upload/upload.component';
import { ResultsComponent } from './components/results/results.component';
import { IncidentsComponent } from './components/incidents/incidents.component';
import { InsightsComponent } from './components/insights/insights.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  { path: '', component: UploadComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'incidents', component: IncidentsComponent },
  { path: 'insights', component: InsightsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' },
];
