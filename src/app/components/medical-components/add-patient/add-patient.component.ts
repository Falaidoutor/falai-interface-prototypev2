import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { Patient } from '../../../models/patient';
import { PatientService } from '../../../service/patientService/patient.service'; 
import { Router, RouterModule } from '@angular/router';
declare var bootstrap: any; 


@Component({
  selector: 'app-add-patient',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-patient.component.html',
  styleUrl: './add-patient.component.css'
})

export class AddPatientComponent {

    patient: Patient = {
        name: '',
        age: 0,
        gender: '',
        queueTicket: '',
        cpf: ''
};

  successModal: any;
  errorModal: any;
  enableQueue: boolean = false;
  mensagemModal: string = '';

constructor(
    private patientService: PatientService,
    private router: Router
  ) {}

  ngAfterViewInit() {
    this.successModal = new bootstrap.Modal(document.getElementById('successModal'));
    this.errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
  }


cadastrarPaciente(): void {
    if (!this.patient.name || !this.patient.age || this.patient.age < 0 || !this.patient.gender || !this.patient.cpf) {
      console.warn('Preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Enviando paciente:', this.patient.name);
    this.patient.cpf = this.patient.cpf.replace(/\D/g, '')

    //Fluxo para criar sem iniciar o paciente na fila
     if(this.enableQueue){
      this.patientService.createPatient(this.patient).subscribe({
        next: response => {
          console.log('Paciente cadastrado com sucesso: ', response);
          this.mostrarSucesso()
          // Limpar formulário
          this.patient = {
            name: '',
            age: 0,
            gender: '',
            cpf: '',
            queueTicket: ''
          };
        },
        error: error => {
          console.error('Erro ao cadastrar paciente: ', error);
          this.mostrarErro('Erro ao cadastrar paciente')
        }
      });
    }

    //Fluxo para criar e iniciar o paciente na fila
    else{
      this.patientService.createPatient(this.patient).subscribe({
        next: response => {
          console.log('Paciente cadastrado com sucesso: ', response);
          this.mostrarSucesso()
          // Limpar formulário
          this.patient = {
            name: '',
            age: 0,
            gender: '',
            cpf: '',
            queueTicket: ''
          };
        },
        error: error => {
          console.error('Erro ao cadastrar paciente e fila: ', error);
          this.mostrarErro("Erro ao cadastrar paciente e fila")
        }
      });
    }
  }

formatarCPF() {
  let cpf = this.patient.cpf.replace(/\D/g, ''); // Remove tudo que não for número

  if (cpf.length > 11) cpf = cpf.substring(0, 11);

  // Aplica a máscara: 000.000.000-00
  if (cpf.length > 9) {
    cpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  } else if (cpf.length > 6) {
    cpf = cpf.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (cpf.length > 3) {
    cpf = cpf.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }

  this.patient.cpf = cpf;
}

mostrarSucesso() {
    this.successModal.show();
  }

  mostrarErro(mensagem: string) {
    this.mensagemModal = mensagem
    this.errorModal.show();
  }

}
