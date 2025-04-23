import { Routes } from '@angular/router';
import { HomeComponent } from './components/patient-components/home/home.component';
import { LoginComponent } from './components/patient-components/login/login.component';
import { ChatTriageComponent } from './components/patient-components/chat-triage/chat-triage.component'
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { TriageCasesComponent } from './components/medical-components/triage-cases/triage-cases.component';
import { TriageCasesLayoutComponent } from './layouts/triage-cases-layout/triage-cases-layout.component';
import { TriageDetailComponent } from './components/medical-components/triage-detail/triage-detail.component';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent, // layout com menu superior e rodapé
        children: [
          { path: '', redirectTo: 'home', pathMatch: 'full' },
          { path: 'home', component: HomeComponent },
          { path: "triage/login",component: LoginComponent},
          { path: "triage/chat/:id", component: ChatTriageComponent}
        ]
      },
      {  
      path: '',
      component: TriageCasesLayoutComponent, 
      children: [
        { path: "medical/cases", component: TriageCasesComponent},
        { path: 'medical/cases/detail/:id', component: TriageDetailComponent }


      ]
    },
   
];
