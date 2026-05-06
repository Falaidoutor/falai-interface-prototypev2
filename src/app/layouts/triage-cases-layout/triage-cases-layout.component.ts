import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TopNavbarComponent } from '../../components/patient-components/top-navbar/top-navbar.component';
import { SidebarComponent } from '../../components/medical-components/sidebar/sidebar.component';

@Component({
  selector: 'app-triage-cases-layout',
  imports: [RouterModule, TopNavbarComponent, SidebarComponent],
  templateUrl: './triage-cases-layout.component.html',
  styleUrl: './triage-cases-layout.component.css'
})
export class TriageCasesLayoutComponent {

}
