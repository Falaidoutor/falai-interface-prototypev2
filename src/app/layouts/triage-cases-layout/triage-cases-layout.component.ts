import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/medical-components/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-triage-cases-layout',
  imports: [RouterModule, SidebarComponent],
  templateUrl: './triage-cases-layout.component.html',
  styleUrl: './triage-cases-layout.component.css'
})
export class TriageCasesLayoutComponent {

}
