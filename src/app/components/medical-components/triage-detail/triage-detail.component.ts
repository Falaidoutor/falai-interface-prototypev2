import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ResultService } from '../../../service/resultsService/result.service';
import { TriageDetail } from '../../../models/triage-detail';
import { ActivatedRoute } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';

interface NovaTriagem {
  analise: string;
  status: string;
}

@Component({
  selector: 'app-triage-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './triage-detail.component.html',
  styleUrl: './triage-detail.component.css'
})
export class TriageDetailComponent implements OnInit {

  patient!: TriageDetail;

  // Controle do modal
  modalAberto = false;

  // Dados do formulário de nova triagem
  triagem: NovaTriagem = {
    analise: '',
    status: ''
  };

  statusDisponiveis: string[] = ['Urgente', 'Grave', 'Moderado', 'Baixo', 'Não urgente'];

  constructor(
    private resultService: ResultService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id !== null) {
      this.resultService.getTriageDetail(id).subscribe({
        next: (patient) => {
          this.patient = patient;

          // Converte o gênero para exibição
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
    } else {
      console.error('ID da triagem não encontrado na URL.');
    }
  }

  abrirModal(): void {
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.resetarFormulario();
  }
  resetarFormulario(): void {
    this.triagem = {
      analise: '',
      status: ''
    };
  }

  modalSucesso = false;
  modalErro = false;

  enviarTriagem(): void {
    if (!this.triagem.analise || !this.triagem.status) {
      this.modalErro = true;
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.modalSucesso = true;
      return;
    }

    this.resultService.enviarNovaTriagem(id, this.triagem).subscribe({
      next: () => {
        this.modalSucesso = true;
      },
      error: () => {
        this.modalSucesso = true;
      }
    });
  }

  fecharModalSucesso() {
    this.modalSucesso = false;
    this.fecharModal(); // Fecha modal principal também
  }

  fecharModalErro() {
    this.modalErro = false;
  }
}
