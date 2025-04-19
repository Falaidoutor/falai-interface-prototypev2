import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CasesComponent } from './components/cases/cases.component';
import { TriageResultComponent } from './components/triage-result/triage-result.component';
import { LoginComponent } from './components/login/login.component';
import { ChatTriageComponent } from './components/chat-triage/chat-triage.component'
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent, // layout com menu superior e rodapé
        children: [
          { path: '', redirectTo: 'home', pathMatch: 'full' },
          { path: 'home', component: HomeComponent },
          { path: "triage/login",component: LoginComponent},
          { path: "triage/chat", component: ChatTriageComponent}
        ]
      },
      
    { path: "cases", component: CasesComponent},
    { path: "triage/results", component: TriageResultComponent},
   
];
