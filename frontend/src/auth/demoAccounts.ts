import type { AuthUser } from './auth-context'

export const demoPassword = 'siih2026'

export const demoAccounts: Array<Omit<AuthUser, 'roleLabel' | 'permissions'>> = [
  { id: 'demo-reception', username: 'recepcion', displayName: 'Andrea Suárez', department: 'Admisión central', role: 'RECEPTION' },
  { id: 'demo-doctor', username: 'medica', displayName: 'Dra. Elena Vargas', department: 'Consulta externa', role: 'DOCTOR' },
  { id: 'demo-nurse', username: 'enfermeria', displayName: 'María Choque', department: 'Enfermería', role: 'NURSE' },
  { id: 'demo-lab', username: 'laboratorio', displayName: 'Marco Quispe', department: 'Laboratorio clínico', role: 'LAB_TECHNICIAN' },
  { id: 'demo-pharmacy', username: 'farmacia', displayName: 'Sofía Rojas', department: 'Farmacia hospitalaria', role: 'PHARMACIST' },
  { id: 'demo-cashier', username: 'caja', displayName: 'Diego Flores', department: 'Caja', role: 'CASHIER' },
  { id: 'demo-director', username: 'direccion', displayName: 'Laura Mendoza', department: 'Dirección médica', role: 'DIRECTOR' },
  { id: 'demo-admin', username: 'admin', displayName: 'Camila Torres', department: 'Tecnología y soporte', role: 'SYSTEM_ADMIN' },
]

export const demoProfiles = demoAccounts.map(({ username, displayName, role }) => ({ username, displayName, role }))
