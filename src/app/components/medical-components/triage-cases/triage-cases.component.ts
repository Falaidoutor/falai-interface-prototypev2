import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ResultService } from '../../../service/resultsService/result.service';
import { PatientResult } from '../../../models/patient-result';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-triage-cases',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './triage-cases.component.html',
  styleUrl: './triage-cases.component.css'
})
export class TriageCasesComponent implements OnInit {

  patients: PatientResult[] = [];
  filteredPatient: PatientResult[] = [];

  nomeFiltro: string = '';
  riscoFiltro: string = '';

  constructor(private resultService: ResultService) {}

  ngOnInit(): void {
    this.resultService.getCases().subscribe({
      next: (cases) => {
        this.patients = cases;

        for (let patient of this.patients) {
          if (patient.gender === 'F') {
            patient.gender = 'Feminino';
          } else if (patient.gender === 'M') {
            patient.gender = 'Masculino';
          }
        }
        
        this.filteredPatient = [...this.patients];
        
        
      },
      error: (err) => {
        console.error('Erro ao carregar triagens:', err);
      }
    });
  }

  aplicarFiltro() {
    this.filteredPatient = this.patients.filter(p => {
      const nomeValido = this.nomeFiltro
        ? p.name.toLowerCase().includes(this.nomeFiltro.toLowerCase())
        : true;
      const riscoValido = this.riscoFiltro
        ? p.risk === this.riscoFiltro
        : true;
      return nomeValido && riscoValido;
    });
  }

  getCorRisco(risk: string): string {
    switch (risk.toLowerCase()) {
      case 'urgente': return '#fe0000';
      case 'grave': return '#a30000';
      case 'moderado': return '#ffd900';
      case 'baixo': return '#28a745';
      case 'não urgente': return '#00e5ff';
      default: return '#6c757d';
    }
  }
}