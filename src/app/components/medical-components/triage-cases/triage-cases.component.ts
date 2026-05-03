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
        ? p.classificacao === this.riscoFiltro
        : true;
      return nomeValido && riscoValido;
    });
  }

  getCorRisco(risk: string): string {
    switch (risk.toLowerCase()) {
      case 'esi-1': return '#a30000';
      case 'esi-2': return '#fe0000';
      case 'esi-3': return '#ffd900';
      case 'esi-4': return '#28a745';
      case 'esi-5': return '#00e5ff';
      default: return '#6c757d';
    }
  }
}
