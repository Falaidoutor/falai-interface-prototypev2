import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  PatientTriageListItem,
  PatientTriageSession,
} from '../../../models/patient-triage';
import { TriageService } from '../../../service/triageService/triage.service';

@Component({
  selector: 'app-patient-triages',
  imports: [CommonModule],
  templateUrl: './patient-triages.component.html',
  styleUrl: './patient-triages.component.css'
})
export class PatientTriagesComponent implements OnInit, OnDestroy {
  triages: PatientTriageListItem[] = [];
  errorMessage = '';
  isLoading = true;
  isRefreshing = false;
  patientName = '';

  private readonly triageSessionStorageKey = 'falai-patient-triage-session';
  private readonly pollingMs = 15000;
  private pollingId: ReturnType<typeof setInterval> | null = null;
  private session: PatientTriageSession | null = null;

  constructor(
    private triageService: TriageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.session = this.readSession();

    if (!this.session) {
      this.router.navigate(['/triage/login']);
      return;
    }

    this.patientName = this.session.patientName ?? '';
    this.loadTriages();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadTriages(showLoading = true): void {
    if (!this.session || this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;
    this.errorMessage = '';

    if (showLoading) {
      this.isLoading = true;
    }

    this.triageService
      .listPatientTriages(this.session)
      .pipe(finalize(() => {
        this.isRefreshing = false;
        this.isLoading = false;
      }))
      .subscribe({
        next: (triages) => {
          this.triages = triages;
          this.syncPolling();
        },
        error: (err) => {
          console.error('Erro ao carregar triagens:', err);
          this.errorMessage = 'Nao foi possivel carregar suas triagens.';
          this.stopPolling();
        }
      });
  }

  startNewTriage(): void {
    this.router.navigate(['/triage/chat/new']);
  }

  changePatient(): void {
    sessionStorage.removeItem(this.triageSessionStorageKey);
    this.router.navigate(['/triage/login']);
  }

  hasPendingTriages(): boolean {
    return this.triages.some((triage) => this.isPending(triage));
  }

  isPending(triage: PatientTriageListItem): boolean {
    return triage.patientStatus !== 'ANALISADA';
  }

  getDisplayColor(triage: PatientTriageListItem): string {
    if (this.isPending(triage)) {
      return '#f5b800';
    }

    if (!triage.displayColor || triage.displayColor === 'yellow') {
      return '#6c757d';
    }

    return triage.displayColor;
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  }

  trackById(_index: number, triage: PatientTriageListItem): number {
    return triage.id;
  }

  private syncPolling(): void {
    if (this.hasPendingTriages()) {
      if (!this.pollingId) {
        this.pollingId = setInterval(() => this.loadTriages(false), this.pollingMs);
      }
      return;
    }

    this.stopPolling();
  }

  private stopPolling(): void {
    if (this.pollingId) {
      clearInterval(this.pollingId);
      this.pollingId = null;
    }
  }

  private readSession(): PatientTriageSession | null {
    const rawSession = sessionStorage.getItem(this.triageSessionStorageKey);

    if (!rawSession) {
      return null;
    }

    try {
      const session = JSON.parse(rawSession) as PatientTriageSession;
      if (!session.cpf) {
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
}
