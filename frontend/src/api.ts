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
}

export function getApiBaseUrl() {
  return API_BASE_URL
}
