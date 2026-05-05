import { reactive } from 'vue'
import type { Line } from '~/types'

export const mockLines = reactive<Line[]>([
  { id: '1',  code: '0A0A00AA000', name: 'Centro – Terminal Norte',     tipoOperacao: 'Urbano',          origin: 'Centro',         destination: 'Terminal Norte',   status: 'active',   vehicleCount: 8, frequency: '15 min' },
  { id: '2',  code: '0A0A00AA000', name: 'Bairro Sul – Aeroporto',      tipoOperacao: 'Metropolitano',   origin: 'Bairro Sul',     destination: 'Aeroporto',        status: 'active',   vehicleCount: 5, frequency: '30 min' },
  { id: '3',  code: '0A0A00AA000', name: 'Terminal Leste – Shopping',   tipoOperacao: 'Urbano',          origin: 'Terminal Leste', destination: 'Shopping Central', status: 'active',   vehicleCount: 6, frequency: '20 min' },
  { id: '4',  code: '0A0A00AA000', name: 'Vila Nova – Hospital Geral',  tipoOperacao: 'Intermunicipal',  origin: 'Vila Nova',      destination: 'Hospital Geral',   status: 'active',   vehicleCount: 4, frequency: '25 min' },
  { id: '5',  code: '0A0A00AA000', name: 'Circular – Centro Histórico', tipoOperacao: 'Urbano',          origin: 'Praça da Sé',    destination: 'Praça da Sé',      status: 'active',   vehicleCount: 4, frequency: '25 min' },
  { id: '6',  code: '0A0A00AA000', name: 'Zona Norte – Estação',        tipoOperacao: 'Urbano',          origin: 'Zona Norte',     destination: 'Estação Central',  status: 'active',   vehicleCount: 7, frequency: '12 min' },
  { id: '7',  code: '0A0A00AA000', name: 'Parque – Universidade',       tipoOperacao: 'Metropolitano',   origin: 'Parque Verde',   destination: 'Universidade',     status: 'active',   vehicleCount: 3, frequency: '40 min' },
  { id: '8',  code: '0A0A00AA000', name: 'Jardim América – Centro',     tipoOperacao: 'Urbano',          origin: 'Jardim América', destination: 'Centro',           status: 'active',   vehicleCount: 5, frequency: '18 min' },
  { id: '9',  code: '0A0A00AA000', name: 'Distrito Industrial – Sede',  tipoOperacao: 'Intermunicipal',  origin: 'Distrito Ind.',  destination: 'Sede Central',     status: 'active',   vehicleCount: 2, frequency: '60 min' },
  { id: '10', code: '0A0A00AA000', name: 'Bela Vista – Terminal Sul',   tipoOperacao: 'Urbano',          origin: 'Bela Vista',     destination: 'Terminal Sul',     status: 'active',   vehicleCount: 6, frequency: '15 min' },
  { id: '11', code: '0A0A00AA000', name: 'São João – Mercado',          tipoOperacao: 'Urbano',          origin: 'Bairro São João', destination: 'Mercado Central', status: 'active',   vehicleCount: 3, frequency: '22 min' },
  { id: '12', code: '0A0A00AA000', name: 'Alto da Serra – Conexão',     tipoOperacao: 'Metropolitano',   origin: 'Alto da Serra',  destination: 'Terminal Conexão', status: 'active',   vehicleCount: 4, frequency: '35 min' },
  { id: '13', code: '0A0A00AA000', name: 'Nova Esperança – Centro',     tipoOperacao: 'Urbano',          origin: 'Nova Esperança', destination: 'Centro',           status: 'active',   vehicleCount: 5, frequency: '20 min' },
  { id: '14', code: '0A0A00AA000', name: 'Região Portuária – Estação',  tipoOperacao: 'Intermunicipal',  origin: 'Porto',          destination: 'Estação Ferr.',    status: 'active',   vehicleCount: 3, frequency: '45 min' },
  { id: '15', code: '0A0A00AA000', name: 'Campus – Polo Tecnológico',   tipoOperacao: 'Metropolitano',   origin: 'Campus Univ.',   destination: 'Polo Tecnológico', status: 'active',   vehicleCount: 2, frequency: '50 min' },
  { id: '16', code: '0A0A00AA000', name: 'Praça Central – Periferia',   tipoOperacao: 'Urbano',          origin: 'Praça Central',  destination: 'Bairro Periferia', status: 'inactive', vehicleCount: 0, frequency: '—'      },
])
