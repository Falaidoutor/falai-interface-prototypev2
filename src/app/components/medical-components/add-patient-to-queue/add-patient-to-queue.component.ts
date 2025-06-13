import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { PatientService } from '../../../service/patientService/patient.service'; 
import { Router, RouterModule } from '@angular/router';
import { Patient } from '../../../models/patient';
declare var bootstrap: any; 

@Component({
  selector: 'app-add-patient-to-queue',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-patient-to-queue.component.html',
  styleUrl: './add-patient-to-queue.component.css'
})
export class AddPatientToQueueComponent {

    mensagemModal: string = '';
    successModal: any;
    errorModal: any;
    queueTicket: string = '';
    patientId: string = '';
    cpfBusca: string = '';
    pacienteEncontrado: Patient | null = null;

  // Simulação de "banco de dados"
  pacientes: Patient[] = [
    { cpf: '123.456.789-00', name: 'João Silva', age: 30, gender: 'M', queueTicket: '' },
    { cpf: '987.654.321-00', name: 'Maria Souza', age: 25, gender: 'F', queueTicket: '' }
  ];

  constructor(
      private patientService: PatientService,
      private router: Router
    ) {}
  
    ngAfterViewInit() {
      this.successModal = new bootstrap.Modal(document.getElementById('successModal'));
      this.errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    }

     adicionarPacienteFila() {
      if (!this.pacienteEncontrado) {
        this.mostrarErro('Nenhum paciente encontrado para o CPF informado.');
        return;
      }

      // Aqui você pode enviar os dados para um serviço, ou adicionar em uma lista
      console.log('Adicionando paciente à fila:', {
      senha: this.queueTicket,
      paciente: this.pacienteEncontrado
      });

      this.mostrarSucesso(`Paciente ${this.pacienteEncontrado.name} adicionado à fila com senha ${this.queueTicket}.`);

      // Resetar formulário
      this.queueTicket = '';
      this.cpfBusca = '';
      this.pacienteEncontrado = null;
    }

  buscarPacientePorCpf() {
    if (this.cpfBusca.length < 14) {
      return; // CPF incompleto
  }

    const paciente = this.pacientes.find(p => p.cpf === this.cpfBusca);

    if (!paciente) {
      this.mostrarErro('Paciente não encontrado!');
      this.pacienteEncontrado = null;
      return;
    }

    // Atribui o paciente encontrado
    this.pacienteEncontrado = paciente;
}

  formatarCPF() {
    // Remove tudo que não é número
    let cpf = this.cpfBusca.replace(/\D/g, '');

    // Aplica a máscara
    if (cpf.length > 3) cpf = cpf.replace(/^(\d{3})(\d)/, '$1.$2');
    if (cpf.length > 6) cpf = cpf.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    if (cpf.length > 9) cpf = cpf.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');

    this.cpfBusca = cpf;
  }

  mostrarSucesso(mensagem: string) {
    this.mensagemModal = mensagem
    this.successModal.show();
  }

  mostrarErro(mensagem: string) {
    this.mensagemModal = mensagem
    this.errorModal.show();
  }
}
