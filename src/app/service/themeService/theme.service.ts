import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'falai-theme';
  private currentTheme: ThemeMode = 'light';

  constructor() {
    const savedTheme = this.document.defaultView?.localStorage.getItem(this.storageKey) as ThemeMode | null;
    const prefersDark = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches;

    this.currentTheme = savedTheme ?? (prefersDark ? 'dark' : 'light');
    this.applyTheme();
  }

  get isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  toggleTheme(): void {
    this.currentTheme = this.isDarkMode ? 'light' : 'dark';
    this.document.defaultView?.localStorage.setItem(this.storageKey, this.currentTheme);
    this.applyTheme();
  }

  private applyTheme(): void {
    this.document.body.classList.toggle('dark-mode', this.isDarkMode);
  }
}
