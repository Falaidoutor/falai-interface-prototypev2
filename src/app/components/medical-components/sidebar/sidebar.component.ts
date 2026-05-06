import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../service/themeService/theme.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  constructor(public themeService: ThemeService) {}
}
