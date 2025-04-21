import { Component } from '@angular/core';
import { TopNavbarComponent } from "../../components/patient-components/top-navbar/top-navbar.component";
import { FooterComponent } from "../../components/patient-components/footer/footer.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [RouterModule, TopNavbarComponent, FooterComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {

}
