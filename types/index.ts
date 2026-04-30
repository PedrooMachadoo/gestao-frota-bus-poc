export interface Vehicle {
  id: string
  plate: string
  model: string
  year: number
  status: 'active' | 'maintenance' | 'inactive'
  line?: string
  mileage: number
}

export interface Driver {
  id: string
  name: string
  cpf: string
  license: string
  licenseExpiry: string
  status: 'active' | 'inactive' | 'on_leave'
  phone: string
  assignedVehicle?: string
}

export interface Line {
  id: string
  code: string
  name: string
  tipoOperacao: string
  origin: string
  destination: string
  status: 'active' | 'inactive'
  vehicleCount: number
  frequency: string
}
