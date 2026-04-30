import type { Vehicle } from '~/types'

export const mockVehicles: Vehicle[] = [
  { id: '1', plate: 'ABC-1234', model: 'Mercedes-Benz OF 1721', year: 2020, status: 'active',      line: 'Linha 101', mileage: 142350 },
  { id: '2', plate: 'DEF-5678', model: 'Volkswagen 17.230 OD',  year: 2019, status: 'active',      line: 'Linha 202', mileage: 198500 },
  { id: '3', plate: 'GHI-9012', model: 'Marcopolo Paradiso',    year: 2021, status: 'maintenance', line: undefined,   mileage: 87200  },
  { id: '4', plate: 'JKL-3456', model: 'Scania K360',           year: 2022, status: 'active',      line: 'Linha 303', mileage: 54100  },
  { id: '5', plate: 'MNO-7890', model: 'Volvo B340R',           year: 2018, status: 'inactive',    line: undefined,   mileage: 312700 },
]
