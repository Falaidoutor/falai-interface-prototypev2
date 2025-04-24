import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ResultService } from '../../../service/resultsService/result.service';
import { TriageDetail } from '../../../models/triage-detail';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-triage-detail',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './triage-detail.component.html',
  styleUrl: './triage-detail.component.css'
})
export class TriageDetailComponent{
  

  patient: TriageDetail =;

  constructor(private resultService: ResultService) {}

  
  ngOnInit(): void {
    this.resultService.getTriageDetail(1).subscribe({
      next: (patient) => {

        
          if (this.patient.gender === 'F') {
            this.patient.gender = 'Feminino';
          } else if (this.patient.gender === 'M') {
            this.patient.gender = 'Masculino';
          }
      },
      error: (err) => {
        console.error('Erro ao carregar triagem:', err);
      }
    });
  }


}
