import { Component, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderer.addClass(entry.target, 'in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2
    });

    const sections = this.el.nativeElement.querySelectorAll('section, .card');
    sections.forEach((section: HTMLElement) => observer.observe(section));
  }
}
