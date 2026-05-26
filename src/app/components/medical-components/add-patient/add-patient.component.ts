import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Patient } from '../../../models/patient';
import { PatientPayload, PatientService } from '../../../service/patientService/patient.service';

@Component({
  selector: 'app-add-patient',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-patient.component.html',
  styleUrl: './add-patient.component.css'
})
export class AddPatientComponent implements OnInit {
  patients: Patient[] = [];
  patient: PatientPayload = this.createEmptyPatient();
  searchTerm = '';
  selectedPatientId: number | null = null;
  isLoading = false;
  isSaving = false;
  deletingPatientId: number | null = null;
  feedbackMessage = '';
  feedbackType: 'success' | 'danger' | '' = '';

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  get filteredPatients(): Patient[] {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();
    const cpfSearch = this.searchTerm.replace(/\D/g, '');

    if (!normalizedSearch) {
      return this.patients;
    }

    return this.patients.filter((patient) =>
      patient.name.toLowerCase().includes(normalizedSearch) ||
      (cpfSearch.length > 0 && patient.cpf.includes(cpfSearch))
    );
  }

  get isEditing(): boolean {
    return this.selectedPatientId !== null;
  }

  loadPatients(): void {
    this.isLoading = true;
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.isLoading = false;
      },
      error: () => {
        this.showFeedback('Erro ao carregar pacientes.', 'danger');
        this.isLoading = false;
      }
    });
  }

  savePatient(): void {
    const validationMessage = this.getPatientValidationMessage();

    if (validationMessage) {
      this.showFeedback(validationMessage, 'danger');
      return;
    }

    const payload = this.toPayload(this.patient);
    this.isSaving = true;

    const request = this.selectedPatientId === null
      ? this.patientService.createPatient(payload)
      : this.patientService.updatePatient(this.selectedPatientId, payload);

    request.subscribe({
      next: () => {
        const message = this.selectedPatientId === null
          ? 'Paciente cadastrado com sucesso.'
          : 'Paciente atualizado com sucesso.';

        this.showFeedback(message, 'success');
        this.resetForm();
        this.loadPatients();
        this.isSaving = false;
      },
      error: () => {
        this.showFeedback('Erro ao salvar paciente.', 'danger');
        this.isSaving = false;
      }
    });
  }

  editPatient(patient: Patient): void {
    this.selectedPatientId = patient.id ?? null;
    this.patient = {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      cpf: this.formatCpf(patient.cpf)
    };
    this.feedbackMessage = '';
    this.feedbackType = '';
  }

  deletePatient(patient: Patient): void {
    if (patient.id === undefined) {
      this.showFeedback('Paciente sem identificador para remocao.', 'danger');
      return;
    }

    const shouldDelete = window.confirm(`Remover o paciente ${patient.name}?`);

    if (!shouldDelete) {
      return;
    }

    this.deletingPatientId = patient.id;
    this.patientService.deletePatient(patient.id).subscribe({
      next: () => {
        this.showFeedback('Paciente removido com sucesso.', 'success');
        if (this.selectedPatientId === patient.id) {
          this.resetForm();
        }
        this.loadPatients();
        this.deletingPatientId = null;
      },
      error: () => {
        this.showFeedback('Erro ao remover paciente.', 'danger');
        this.deletingPatientId = null;
      }
    });
  }

  resetForm(): void {
    this.selectedPatientId = null;
    this.patient = this.createEmptyPatient();
  }

  formatarCPF(): void {
    this.patient.cpf = this.formatCpf(this.patient.cpf);
  }

  formatCpfForDisplay(cpf: string): string {
    return this.formatCpf(cpf);
  }

  getGenderLabel(gender: string): string {
    if (gender.toUpperCase() === 'M') {
      return 'Masculino';
    }

    if (gender.toUpperCase() === 'F') {
      return 'Feminino';
    }

    return gender;
  }

  trackByPatientId(_: number, patient: Patient): number | undefined {
    return patient.id;
  }

  private createEmptyPatient(): PatientPayload {
    return {
      name: '',
      age: 0,
      gender: '',
      cpf: ''
    };
  }

  private getPatientValidationMessage(): string {
    const age = Number(this.patient.age);

    if (!this.patient.name.trim() || !this.patient.cpf.trim() || !Number.isFinite(age) || !this.patient.gender) {
      return 'Preencha nome, CPF, idade e gênero.';
    }

    if (age < 0) {
      return 'Idade deve ser zero ou maior.';
    }

    return '';
  }

  private toPayload(patient: PatientPayload): PatientPayload {
    return {
      name: patient.name.trim(),
      age: Number(patient.age),
      gender: patient.gender,
      cpf: patient.cpf.replace(/\D/g, '')
    };
  }

  private formatCpf(value: string): string {
    let cpf = value.replace(/\D/g, '');

    if (cpf.length > 11) {
      cpf = cpf.substring(0, 11);
    }

    if (cpf.length > 9) {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    }

    if (cpf.length > 6) {
      return cpf.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    }

    if (cpf.length > 3) {
      return cpf.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }

    return cpf;
  }

  private showFeedback(message: string, type: 'success' | 'danger'): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
  }
}
