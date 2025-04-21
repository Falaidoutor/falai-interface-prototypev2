import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-triage-cases',
  imports: [CommonModule, FormsModule],
  templateUrl: './triage-cases.component.html',
  styleUrl: './triage-cases.component.css'
})
export class TriageCasesComponent {
  
  pacientes = [
    { nome: 'Rodrigo Martins', idade: 56, genero: 'Masculino', risco: 'Urgente', senha: '1324-B' },
    { nome: 'João Silva', idade: 29, genero: 'Masculino', risco: 'Moderado', senha: '783-U' },
    { nome: 'Luanna Rodriguez', idade: 34, genero: 'Feminino', risco: 'Baixo', senha: '1325-B' },
    { nome: 'Renata Maria', idade: 45, genero: 'Feminino', risco: 'Pouco urgente', senha: '2344-C' }
  ];
  
  
  getCorRisco(risco: string): string {
    switch (risco.toLowerCase()) {
      case 'urgente': return '#fe0000';
      case 'grave': return '#a30000';
      case 'moderado': return '#ffd900';
      case 'baixo': return '#28a745';
      case 'pouco urgente':
      case 'não urgente': return '#00e5ff';
      default: return '#6c757d';
    }
  }

  // Variáveis de filtro
  nomeFiltro: string = '';
  riscoFiltro: string = '';

  pacientesFiltrados: any[] = [...this.pacientes];
  

aplicarFiltro() {
  
  this.pacientesFiltrados = this.pacientes.filter(p => {
    const nomeValido = this.nomeFiltro
      ? p.nome.toLowerCase().includes(this.nomeFiltro.toLowerCase())
      : true;
    const riscoValido = this.riscoFiltro
      ? p.risco === this.riscoFiltro
      : true;
    return nomeValido && riscoValido;
  });
}

}