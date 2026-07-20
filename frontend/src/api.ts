const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1').replace(/\/$/, '')

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED'
export type DocumentType = 'CI' | 'PASSPORT' | 'FOREIGN_ID' | 'NONE'
export type Sex = 'FEMALE' | 'MALE' | 'INTERSEX' | 'UNKNOWN' | 'NOT_DECLARED'

export type Patient = {
  id: string
  patientCode: string
  documentType: DocumentType
  documentNumber: string | null
  fullName: string
  birthDate: string
  age: number
  sex: Sex
  phone: string | null
  email: string | null
  address: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  bloodType: string | null
  status: PatientStatus
}

export type Specialty = {
  id: string
  code: string
  name: string
  description: string | null
}

export type Professional = {
  id: string
  professionalCode: string
  professionalType: string
  displayName: string
  licenseNumber: string | null
}

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'NO_SHOW'

export type Appointment = {
  id: string
  appointmentCode: string
  patientId: string
  professionalId: string
  specialtyId: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  reason: string | null
  cancellationReason: string | null
  arrivedAt: string | null
}

export type PatientCreateRequest = {
  documentType: DocumentType
  documentNumber?: string
  firstName: string
  middleName?: string
  lastName: string
  secondLastName?: string
  birthDate: string
  sex: Sex
  phone?: string
  email?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  bloodType?: string
}

export type AppointmentCreateRequest = {
  patientId: string
  professionalId: string
  specialtyId: string
  startsAt: string
  endsAt: string
  reason?: string
  idempotencyKey: string
}

export type PatientUpdateRequest = {
  firstName: string
  middleName?: string
  lastName: string
  secondLastName?: string
  birthDate: string
  sex: Sex
  phone?: string
  email?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  bloodType?: string
  status: PatientStatus
}

export type ClinicalHistory = {
  id: string
  patientId: string
  background: string | null
  allergies: string | null
  familyHistory: string | null
  surgicalHistory: string | null
  relevantNotes: string | null
  updatedAt: string
}

export type Consultation = {
  id: string
  consultationCode: string
  encounterId: string
  patientId: string
  professionalId: string
  chiefComplaint: string
  evolution: string | null
  diagnosisSummary: string | null
  treatmentPlan: string | null
  recommendations: string | null
  status: 'DRAFT' | 'CLOSED' | 'AMENDED' | 'CANCELLED'
  signedAt: string | null
  createdAt: string
}

export type ConsultationCreateRequest = {
  patientId: string
  professionalId: string
  appointmentId?: string
  chiefComplaint: string
  evolution?: string
  recommendations?: string
}

export type ConsultationCloseRequest = {
  chiefComplaint: string
  evolution?: string
  diagnosisSummary: string
  treatmentPlan: string
  recommendations?: string
}

export type LaboratoryOverview = {
  summary: { totalOrders: number; pendingOrders: number; completedOrders: number }
  catalog: Array<{ id: string; code: string; name: string; sampleType: string | null; unit: string | null; referenceRange: string | null; price: number; active: boolean }>
  orders: Array<{ id: string; orderCode: string; patientCode: string; patientName: string; consultationCode: string; status: string; clinicalNotes: string | null; requestedAt: string; testCount: number }>
}

export type PharmacyOverview = {
  summary: { medicationCount: number; activeMedicationCount: number; lowStockCount: number }
  medications: Array<{ id: string; code: string; genericName: string; commercialName: string | null; presentation: string; concentration: string | null; route: string | null; minimumStock: number; availableQuantity: number; batchCount: number; nextExpiry: string | null; active: boolean }>
  prescriptions: Array<{ id: string; prescriptionCode: string; patientCode: string; patientName: string; status: string; issuedOn: string; validUntil: string | null }>
}

export type InventoryOverview = {
  summary: { stockLines: number; totalUnits: number; lowStockLines: number; expiringSoonLines: number }
  locations: Array<{ id: string; code: string; name: string; locationType: string; active: boolean }>
  stock: Array<{ id: string; medicationCode: string; genericName: string; batchCode: string; expiresOn: string; locationCode: string; locationName: string; availableQuantity: number; reservedQuantity: number; lowStock: boolean }>
  movements: Array<{ id: string; movementCode: string; genericName: string; movementType: string; quantity: number; reason: string | null; occurredAt: string }>
}

export type BillingOverview = {
  summary: { chargeCount: number; pendingChargeCount: number; pendingAmount: number }
  invoices: Array<{ id: string; invoiceCode: string; patientCode: string; patientName: string; status: string; currency: string; subtotal: number; discount: number; tax: number; total: number; issuedAt: string | null }>
  charges: Array<{ id: string; chargeCode: string; patientCode: string; description: string | null; quantity: number; unitPrice: number; subtotal: number; status: string; registeredAt: string }>
  payments: Array<{ id: string; paymentCode: string; invoiceCode: string; amount: number; paymentMethod: string; status: string; paidAt: string }>
}

export type ReportsOverview = {
  summary: { activePatients: number; activeAppointments: number; consultations: number; labOrders: number; invoices: number; inventoryUnits: number }
  appointmentsByStatus: Array<{ status: string; count: number }>
  appointmentsBySpecialty: Array<{ specialty: string; count: number }>
  recentActivity: Array<{ type: string; code: string; status: string; occurredAt: string }>
}

export type AdministrationOverview = {
  summary: { userCount: number; activeUserCount: number; lockedUserCount: number; auditEventCount: number }
  users: Array<{ id: string; username: string; displayName: string; email: string | null; status: string; lastLoginAt: string | null; roles: string }>
  audit: Array<{ id: string; action: string; entityType: string; success: boolean; eventAt: string; username: string | null }>
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError('No se pudo conectar con el backend.', 0)
  }

  const body = await response.text()
  let payload: { message?: string; code?: string } | undefined
  if (body) {
    try {
      payload = JSON.parse(body) as { message?: string; code?: string }
    } catch {
      payload = undefined
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.message ?? `La solicitud falló (${response.status}).`, response.status, payload?.code)
  }

  return body ? JSON.parse(body) as T : (undefined as T)
}

function queryString(parameters: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export const api = {
  getPatients(search = '', page = 0, size = 20) {
    return request<PageResponse<Patient>>(`/patients${queryString({ search, page, size, sort: 'lastName' })}`)
  },

  getPatient(id: string) {
    return request<Patient>(`/patients/${id}`)
  },

  updatePatient(id: string, payload: PatientUpdateRequest) {
    return request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  findPatientDuplicates(parameters: { documentNumber?: string; firstName: string; lastName: string; birthDate: string }) {
    return request<Patient[]>(`/patients/duplicate-check${queryString(parameters)}`)
  },

  createPatient(payload: PatientCreateRequest) {
    return request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getSpecialties() {
    return request<Specialty[]>('/specialties')
  },

  getProfessionals() {
    return request<Professional[]>('/professionals')
  },

  getAppointments(page = 0, size = 50, filters: { from?: string; to?: string; status?: AppointmentStatus } = {}) {
    return request<PageResponse<Appointment>>(`/appointments${queryString({ page, size, ...filters })}`)
  },

  createAppointment(payload: AppointmentCreateRequest) {
    return request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  registerArrival(id: string) {
    return request<Appointment>(`/appointments/${id}/arrival`, { method: 'PATCH' })
  },

  cancelAppointment(id: string, reason: string) {
    return request<Appointment>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  },

  getClinicalHistory(patientId: string) {
    return request<ClinicalHistory>(`/patients/${patientId}/clinical-history`)
  },

  updateClinicalHistory(patientId: string, payload: Omit<ClinicalHistory, 'id' | 'patientId' | 'updatedAt'>) {
    return request<ClinicalHistory>(`/patients/${patientId}/clinical-history`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  getConsultation(id: string) {
    return request<Consultation>(`/consultations/${id}`)
  },

  getPatientConsultations(patientId: string) {
    return request<Consultation[]>(`/patients/${patientId}/consultations`)
  },

  createConsultation(payload: ConsultationCreateRequest) {
    return request<Consultation>('/consultations', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  closeConsultation(id: string, payload: ConsultationCloseRequest) {
    return request<Consultation>(`/consultations/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  getLaboratoryOverview() {
    return request<LaboratoryOverview>('/laboratory/overview')
  },

  getPharmacyOverview() {
    return request<PharmacyOverview>('/pharmacy/overview')
  },

  getInventoryOverview() {
    return request<InventoryOverview>('/inventory/overview')
  },

  getBillingOverview() {
    return request<BillingOverview>('/billing/overview')
  },

  getReportsOverview() {
    return request<ReportsOverview>('/reports/overview')
  },

  getAdministrationOverview() {
    return request<AdministrationOverview>('/administration/overview')
  },
}

export function getApiBaseUrl() {
  return API_BASE_URL
}
