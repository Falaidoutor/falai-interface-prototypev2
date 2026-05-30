import { Routes } from '@angular/router';
import { HomeComponent } from './components/patient-components/home/home.component';
import { AboutComponent } from './components/patient-components/about/about.component';
import { LoginComponent } from './components/patient-components/login/login.component';
import { ChatTriageComponent } from './components/patient-components/chat-triage/chat-triage.component';
import { PatientTriagesComponent } from './components/patient-components/patient-triages/patient-triages.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { TriageCasesComponent } from './components/medical-components/triage-cases/triage-cases.component';
import { TriageCasesLayoutComponent } from './layouts/triage-cases-layout/triage-cases-layout.component';
import { TriageDetailComponent } from './components/medical-components/triage-detail/triage-detail.component';
import { AddPatientComponent } from './components/medical-components/add-patient/add-patient.component';
import { AppLoginComponent } from './components/app-login/app-login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: AppLoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'about', component: AboutComponent },
      { path: 'triage/login', component: LoginComponent },
      { path: 'triagens', component: PatientTriagesComponent },
      { path: 'triages', redirectTo: 'triagens', pathMatch: 'full' },
      { path: 'triage/chat/:id', component: ChatTriageComponent }
    ]
  },
  {
    path: '',
    component: TriageCasesLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: 'medical/cases', component: TriageCasesComponent },
      { path: 'medical/cases/detail/:id', component: TriageDetailComponent },
      { path: 'medical/cases/create', component: AddPatientComponent }
    ]
  },
  { path: '**', redirectTo: 'home' }
];
