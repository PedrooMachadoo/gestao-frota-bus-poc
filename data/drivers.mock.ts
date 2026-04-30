import type { Driver } from '~/types'

export const mockDrivers: Driver[] = [
  { id: '1', name: 'Carlos Silva',    cpf: '123.456.789-00', license: '12345678900', licenseExpiry: '2026-05-10', status: 'active',   phone: '(11) 98765-4321', assignedVehicle: 'ABC-1234' },
  { id: '2', name: 'Ana Pereira',     cpf: '987.654.321-00', license: '98765432100', licenseExpiry: '2025-11-30', status: 'active',   phone: '(11) 91234-5678', assignedVehicle: 'DEF-5678' },
  { id: '3', name: 'Roberto Santos',  cpf: '456.789.123-00', license: '45678912300', licenseExpiry: '2027-03-15', status: 'on_leave', phone: '(11) 99876-5432', assignedVehicle: undefined  },
  { id: '4', name: 'Fernanda Costa',  cpf: '321.654.987-00', license: '32165498700', licenseExpiry: '2026-08-22', status: 'active',   phone: '(11) 93456-7890', assignedVehicle: 'JKL-3456' },
  { id: '5', name: 'Marcos Oliveira', cpf: '654.321.789-00', license: '65432178900', licenseExpiry: '2024-12-01', status: 'inactive', phone: '(11) 95678-1234', assignedVehicle: undefined  },
]
