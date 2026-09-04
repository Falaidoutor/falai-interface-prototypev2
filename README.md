# FalAI Triage — interface web do Falaidoutor

Este repositório contém o frontend web do **Falaidoutor**, uma plataforma de apoio à triagem clínica. Ele apresenta os fluxos de entrada do paciente, acompanhamento da fila, análise das triagens, revisão por profissional e painéis operacionais. O frontend consome a API do backend e não substitui a avaliação de um profissional de saúde.

## Papel deste componente

É a camada de interface e experiência do usuário do sistema: organiza as telas, sessões, navegação, componentes visuais e chamadas para a API. Regras de negócio, persistência e processamento de IA pertencem aos componentes backend e modelo.

Frontend:

- React 19
- Vite
- TanStack Start
- TypeScript
- Tailwind CSS
- Radix UI / shadcn-style components

Configurado para deploy na Vercel.

## Scripts

- `npm run dev`: inicia o servidor local de desenvolvimento.
- `npm run build`: gera o build de produção.
- `npm run preview`: executa o preview local do build.
- `npm run lint`: roda o ESLint.

## Vercel

O projeto usa o preset `tanstack-start` via `vercel.json`. Na Vercel, deixe sem overrides antigos de framework ou output directory.
