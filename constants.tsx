
import React from 'react';

export const MECHANICS = [
  'ADILSON',
  'CÉLIO',
  'EUCLEBER',
  'GIOVANE',
  'PEDRO',
  'STENIO'
];

export const CATEGORIES = [
  'Trocas',
  'Conferências',
  'Ajustes',
  'Reparos',
  'Preventiva',
  'Solda',
  'Socorro'
];

export const SYSTEMS = [
  'Motor',
  'Freio',
  'Suspensão / Rodagem',
  'Elétrica',
  'Cabine',
  'Pneumático / Hidráulico',
  'Estrutura'
];

export const SERVICES_BY_CATEGORY: Record<string, string[]> = {
  'Trocas': [
    'Troca óleo', 'Troca filtro óleo', 'Troca filtro diesel', 'Troca filtro ar',
    'Troca turbina', 'Troca intercooler', 'Troca suporte motor', 'Troca coxim motor',
    'Troca coxim caixa', 'Troca coxim cabine', 'Troca embreagem', 'Troca amortecedor',
    'Troca pneu', 'Troca válvulas pneumáticas', 'Troca bomba hidráulica',
    'Troca farol', 'Troca retrovisores'
  ],
  'Conferências': [
    'Conferência parte elétrica', 'Conferir óleo caixa', 'Conferir diferencial', 'Conferir bomba d’água'
  ],
  'Ajustes': [
    'Regular freio', 'Fazer freio', 'Calibragem pneu'
  ],
  'Reparos': [
    'Reparo freio motor', 'Reparo alavanca marcha'
  ],
  'Preventiva': [
    'Lubrificação', 'Limpeza sistema refrigeração', 'Soprar filtros'
  ],
  'Solda': [
    'Solda geral', 'Solda chassi', 'Solda fabricação'
  ],
  'Socorro': [
    'Socorro caminhão', 'Socorro carreta', 'Socorro máquina'
  ]
};

export const QUANTITY_REQUIRED_SERVICES = [
  'Troca pneu',
  'Troca amortecedor',
  'Troca componentes de suspensão'
];

export const QUICK_SERVICES = [
  { name: 'Troca óleo', category: 'Trocas', system: 'Motor' },
  { name: 'Troca filtro óleo', category: 'Trocas', system: 'Motor' },
  { name: 'Lubrificação', category: 'Preventiva', system: 'Estrutura' },
  { name: 'Calibragem pneu', category: 'Ajustes', system: 'Suspensão / Rodagem' }
];
