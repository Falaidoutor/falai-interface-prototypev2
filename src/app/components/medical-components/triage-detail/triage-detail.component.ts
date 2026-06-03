import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ResultService } from '../../../service/resultsService/result.service';
import { TriageDetail } from '../../../models/triage-detail';
import { ActivatedRoute, Router } from '@angular/router';

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

  statusDisponiveis: string[] = ['ESI-1', 'ESI-2', 'ESI-3', 'ESI-4', 'ESI-5'];

  constructor(
    private resultService: ResultService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const source = this.route.snapshot.queryParamMap.get('source');

    if (id !== null) {
      const detailRequest = source === 'patient-triage'
        ? this.resultService.getPatientTriageDetail(id)
        : this.resultService.getTriageDetail(id);

      detailRequest.subscribe({
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
  modalExclusaoErro = false;
  excluindoTriagem = false;

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

    const source = this.route.snapshot.queryParamMap.get('source');
    const reviewRequest = source === 'patient-triage'
      ? this.resultService.revisarPatientTriage(id, this.triagem)
      : this.resultService.enviarNovaTriagem(id, this.triagem);

    reviewRequest.subscribe({
      next: () => {
        this.modalSucesso = true;
      },
      error: (err) => {
        console.error('Erro ao enviar nova triagem:', err);
        this.modalErro = true;
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

  excluirTriagem(): void {
    if (this.excluindoTriagem) {
      return;
    }

    if (this.patient?.source === 'patient-triage') {
      this.modalExclusaoErro = true;
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.modalExclusaoErro = true;
      return;
    }

    this.excluindoTriagem = true;
    this.resultService.deleteTriage(id).subscribe({
      next: () => {
        this.router.navigate(['/medical/cases']);
      },
      error: (err) => {
        console.error('Erro ao excluir triagem:', err);
        this.excluindoTriagem = false;
        this.modalExclusaoErro = true;
      }
    });
  }

  fecharModalExclusaoErro(): void {
    this.modalExclusaoErro = false;
  }
}
