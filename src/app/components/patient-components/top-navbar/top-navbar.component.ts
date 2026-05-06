import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../service/themeService/theme.service';

@Component({
  selector: 'app-top-navbar',
  imports: [RouterModule],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.css'
})
export class TopNavbarComponent {
  constructor(public themeService: ThemeService) {}
}
