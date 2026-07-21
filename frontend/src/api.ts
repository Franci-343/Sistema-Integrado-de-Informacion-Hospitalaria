import { clearStoredSession, dispatchSessionEvent, readStoredSession, SESSION_EXPIRED_EVENT, SESSION_UPDATED_EVENT, writeStoredSession } from './auth/session'
import type { AuthUser } from './auth/auth-context'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1').replace(/\/$/, '')

export type AuthUserResponse = {
  id: string
  username: string
  displayName: string
  email: string | null
  department: string
  role: string
  roleLabel: string
  roles: string[]
  permissions: string[]
}

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  user: AuthUserResponse
}

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

export type Triage = {
  id: string
  encounterId: string
  encounterCode: string
  patientId: string
  patientCode: string
  patientName: string
  priority: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE'
  temperatureC: number | null
  systolicBp: number | null
  diastolicBp: number | null
  heartRate: number | null
  respiratoryRate: number | null
  oxygenSaturation: number | null
  weightKg: number | null
  heightCm: number | null
  notes: string | null
  recordedBy: string
  recordedAt: string
}

export type TriageRequest = Omit<Triage, 'id' | 'encounterCode' | 'patientCode' | 'patientName' | 'recordedBy' | 'recordedAt' | 'encounterId'> & { encounterId?: string }

export type Bed = { id: string; code: string; room: string; bed: string; status: string }
export type NursingNote = { id: string; note: string; recordedBy: string; recordedAt: string }
export type Hospitalization = {
  id: string
  hospitalizationCode: string
  patientId: string
  patientCode: string
  patientName: string
  bedId: string
  bedCode: string
  room: string
  bed: string
  status: string
  admissionReason: string
  dischargeInstructions: string | null
  responsibleProfessional: string
  admittedAt: string
  dischargedAt: string | null
  nursingNotes: NursingNote[]
}

export type LabTest = { id: string; code: string; name: string; sampleType: string; unit: string | null; referenceRange: string | null; price: number; active: boolean }
export type LabResult = { id: string; orderItemId: string; resultText: string | null; numericValue: number | null; unit: string | null; referenceRange: string | null; observations: string | null; status: string; recordedBy: string; validatedBy: string | null; recordedAt: string; validatedAt: string | null; publishedAt: string | null }
export type LabOrderItem = { id: string; testId: string; testCode: string; testName: string; sampleType: string; status: string; observations: string | null; result: LabResult | null }
export type LabSample = { id: string; sampleCode: string; sampleType: string; status: string; collectedAt: string; receivedAt: string; rejectionReason: string | null; receivedBy: string }
export type LabOrder = { id: string; orderCode: string; consultationId: string; consultationCode: string; patientId: string; patientCode: string; patientName: string; requestedBy: string; status: string; clinicalNotes: string | null; requestedAt: string; items: LabOrderItem[]; samples: LabSample[] }

export type Medication = { id: string; code: string; genericName: string; commercialName: string | null; presentation: string; concentration: string | null; route: string | null; minimumStock: number; availableQuantity: number; active: boolean }
export type PrescriptionItem = { id: string; medicationId: string; medicationCode: string; medicationName: string; presentation: string; dose: string; route: string; frequency: string; duration: string; quantityPrescribed: number; quantityDispensed: number; instructions: string }
export type Prescription = { id: string; prescriptionCode: string; consultationId: string; consultationCode: string; patientId: string; patientCode: string; patientName: string; prescriber: string; issuedOn: string; validUntil: string | null; status: string; notes: string | null; items: PrescriptionItem[] }
export type InventoryLocation = { id: string; code: string; name: string; locationType: string; active: boolean }
export type BatchStock = { batchId: string; medicationId: string; medicationCode: string; medicationName: string; batchCode: string; receivedOn: string; expiresOn: string; unitCost: number; supplierName: string | null; locationId: string; locationCode: string; locationName: string; availableQuantity: number; reservedQuantity: number; active: boolean }
export type Dispensation = { id: string; dispensationCode: string; prescriptionId: string; prescriptionCode: string; patientId: string; patientCode: string; patientName: string; pharmacist: string; status: string; dispensedAt: string; notes: string | null; items: Array<{ id: string; prescriptionItemId: string; medicationName: string; batchId: string; batchCode: string; quantity: number; unitPrice: number }> }
export type StockMovement = { id: string; movementCode: string; medicationId: string; medicationName: string; batchId: string; batchCode: string; sourceLocationId: string | null; targetLocationId: string | null; movementType: string; quantity: number; reason: string | null; performedBy: string; occurredAt: string }

export type ServiceItem = { id: string; code: string; name: string; description: string | null; serviceType: string; defaultPrice: number; active: boolean }
export type Charge = { id: string; chargeCode: string; patientId: string; patientCode: string; patientName: string; description: string; quantity: number; unitPrice: number; subtotal: number; status: string; registeredAt: string }
export type Payment = { id: string; paymentCode: string; invoiceId: string; invoiceCode: string; amount: number; paymentMethod: string; status: string; paidAt: string; registeredBy: string }
export type Invoice = { id: string; invoiceCode: string; patientId: string; patientCode: string; patientName: string; status: string; currency: string; subtotal: number; discount: number; tax: number; total: number; paidAmount: number; balance: number; issuedAt: string | null; createdAt: string; items: Array<{ id: string; chargeId: string; description: string; quantity: number; unitPrice: number; subtotal: number }>; payments: Payment[] }

export type AdminUser = { id: string; username: string; firstName: string; lastName: string; displayName: string; email: string | null; status: string; failedLoginAttempts: number; lockedUntil: string | null; lastLoginAt: string | null; createdAt: string; roles: string[]; permissions: string[] }
export type Role = { id: string; code: string; name: string; description: string | null; active: boolean; permissions: string[] }
export type AuditEvent = { id: string; userId: string | null; username: string | null; action: string; entityType: string; entityId: string | null; origin: string | null; success: boolean; failureReason: string | null; eventAt: string }
export type Notification = { id: string; channel: string; templateCode: string; message: string; status: string; createdAt: string; sentAt: string | null; readAt: string | null }

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

let refreshRequest: Promise<boolean> | null = null

async function request<T>(path: string, options: RequestInit = {}, retryAfterRefresh = true): Promise<T> {
  let response: Response
  const session = readStoredSession()

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError('No se pudo conectar con el backend.', 0)
  }

  if (response.status === 401 && retryAfterRefresh && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession()
    if (refreshed) return request<T>(path, options, false)
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

async function refreshSession() {
  if (refreshRequest) return refreshRequest
  refreshRequest = doRefreshSession().finally(() => { refreshRequest = null })
  return refreshRequest
}

async function doRefreshSession() {
  const session = readStoredSession()
  if (!session) return false
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
    if (!response.ok) throw new Error('Refresh rejected')
    const refreshed = await response.json() as AuthResponse
    writeStoredSession({ ...refreshed, user: refreshed.user as AuthUser }, session.persistent)
    dispatchSessionEvent(SESSION_UPDATED_EVENT)
    return true
  } catch {
    clearStoredSession()
    dispatchSessionEvent(SESSION_EXPIRED_EVENT)
    return false
  }
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
  login(username: string, password: string, remember: boolean) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, remember }),
    })
  },

  getMe() {
    return request<AuthUserResponse>('/auth/me')
  },

  refresh(refreshToken: string) {
    return request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },

  logout(refreshToken: string) {
    return request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },

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

  getTriage(patientId?: string) {
    return request<Triage[]>(`/triage${queryString({ patientId })}`)
  },

  createTriage(payload: TriageRequest) {
    return request<Triage>('/triage', { method: 'POST', body: JSON.stringify(payload) })
  },

  updateTriage(id: string, payload: Omit<TriageRequest, 'patientId' | 'encounterId'>) {
    return request<Triage>(`/triage/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },

  getBeds(status?: string) {
    return request<Bed[]>(`/beds${queryString({ status })}`)
  },

  getHospitalizations(patientId?: string, status?: string) {
    return request<Hospitalization[]>(`/hospitalizations${queryString({ patientId, status })}`)
  },

  admitPatient(payload: { patientId: string; bedId: string; responsibleProfessionalId: string; admissionReason: string }) {
    return request<Hospitalization>('/hospitalizations', { method: 'POST', body: JSON.stringify(payload) })
  },

  addNursingNote(id: string, note: string) {
    return request<NursingNote>(`/hospitalizations/${id}/nursing-notes`, { method: 'POST', body: JSON.stringify({ note }) })
  },

  dischargePatient(id: string, dischargeInstructions: string) {
    return request<Hospitalization>(`/hospitalizations/${id}/discharge`, { method: 'PUT', body: JSON.stringify({ dischargeInstructions }) })
  },

  getLabTests() {
    return request<LabTest[]>('/lab-tests')
  },

  getLabOrders(patientId?: string, status?: string) {
    return request<LabOrder[]>(`/lab-orders${queryString({ patientId, status })}`)
  },

  createLabOrder(payload: { consultationId: string; testIds: string[]; clinicalNotes?: string; idempotencyKey: string }) {
    return request<LabOrder>('/lab-orders', { method: 'POST', body: JSON.stringify(payload) })
  },

  receiveLabSample(orderId: string, sampleType: string) {
    return request<LabSample>(`/lab-orders/${orderId}/samples`, { method: 'POST', body: JSON.stringify({ sampleType }) })
  },

  updateLabSample(orderId: string, sampleId: string, status: string, rejectionReason?: string) {
    return request<LabSample>(`/lab-orders/${orderId}/samples/${sampleId}`, { method: 'PUT', body: JSON.stringify({ status, rejectionReason }) })
  },

  saveLabResult(payload: { orderItemId: string; resultText?: string; numericValue?: number; unit?: string; referenceRange?: string; observations?: string }) {
    return request<LabResult>('/lab-results', { method: 'POST', body: JSON.stringify(payload) })
  },

  validateLabResult(id: string) {
    return request<LabResult>(`/lab-results/${id}/validate`, { method: 'PUT' })
  },

  publishLabResult(id: string) {
    return request<LabResult>(`/lab-results/${id}/publish`, { method: 'PUT' })
  },

  getMedications() {
    return request<Medication[]>('/medications')
  },

  getPrescriptions(patientId?: string, status?: string) {
    return request<Prescription[]>(`/prescriptions${queryString({ patientId, status })}`)
  },

  createPrescription(payload: { consultationId: string; validUntil?: string; notes?: string; idempotencyKey: string; items: Array<{ medicationId: string; dose: string; route: string; frequency: string; duration: string; quantity: number; instructions: string }> }) {
    return request<Prescription>('/prescriptions', { method: 'POST', body: JSON.stringify(payload) })
  },

  getDispensations(patientId?: string) {
    return request<Dispensation[]>(`/dispensations${queryString({ patientId })}`)
  },

  createDispensation(payload: { prescriptionId: string; idempotencyKey: string; notes?: string; items: Array<{ prescriptionItemId: string; batchId: string; quantity: number }> }) {
    return request<Dispensation>('/dispensations', { method: 'POST', body: JSON.stringify(payload) })
  },

  getInventoryLocations() {
    return request<InventoryLocation[]>('/inventory/locations')
  },

  getInventoryBatches(medicationId?: string, availableOnly = false) {
    return request<BatchStock[]>(`/inventory/batches${queryString({ medicationId, availableOnly: String(availableOnly) })}`)
  },

  createInventoryBatch(payload: { medicationId: string; batchCode: string; receivedOn: string; expiresOn: string; unitCost: number; supplierName?: string; locationId: string; initialQuantity: number; idempotencyKey: string }) {
    return request<BatchStock>('/inventory/batches', { method: 'POST', body: JSON.stringify(payload) })
  },

  getStockMovements(batchId?: string) {
    return request<StockMovement[]>(`/stock-movements${queryString({ batchId })}`)
  },

  createStockMovement(payload: { batchId: string; movementType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'; sourceLocationId?: string; targetLocationId?: string; adjustmentDirection?: 'INCREASE' | 'DECREASE'; quantity: number; reason?: string; idempotencyKey: string }) {
    return request<StockMovement>('/stock-movements', { method: 'POST', body: JSON.stringify(payload) })
  },

  getServices() {
    return request<ServiceItem[]>('/services')
  },

  getCharges(patientId?: string, status?: string) {
    return request<Charge[]>(`/charges${queryString({ patientId, status })}`)
  },

  createCharge(payload: { patientId: string; serviceId: string; quantity: number; unitPrice?: number; idempotencyKey: string }) {
    return request<Charge>('/charges', { method: 'POST', body: JSON.stringify(payload) })
  },

  getInvoices(patientId?: string, status?: string) {
    return request<Invoice[]>(`/invoices${queryString({ patientId, status })}`)
  },

  createInvoice(payload: { patientId: string; chargeIds: string[]; discount: number; tax: number; idempotencyKey: string }) {
    return request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(payload) })
  },

  issueInvoice(id: string) {
    return request<Invoice>(`/invoices/${id}/issue`, { method: 'PUT' })
  },

  getPayments(invoiceId?: string) {
    return request<Payment[]>(`/payments${queryString({ invoiceId })}`)
  },

  createPayment(payload: { invoiceId: string; amount: number; paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'QR' | 'OTHER'; idempotencyKey: string }) {
    return request<Payment>('/payments', { method: 'POST', body: JSON.stringify(payload) })
  },

  getUsers(search?: string, status?: string) {
    return request<AdminUser[]>(`/users${queryString({ search, status })}`)
  },

  createUser(payload: { username: string; password: string; firstName: string; lastName: string; email?: string; roleCodes: string[] }) {
    return request<AdminUser>('/users', { method: 'POST', body: JSON.stringify(payload) })
  },

  updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'LOCKED') {
    return request<AdminUser>(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  },

  updateUserRoles(id: string, roleCodes: string[]) {
    return request<AdminUser>(`/users/${id}/roles`, { method: 'PUT', body: JSON.stringify({ roleCodes }) })
  },

  getRoles() {
    return request<Role[]>('/roles')
  },

  getAuditEvents() {
    return request<AuditEvent[]>('/audit-events')
  },

  getNotifications() {
    return request<Notification[]>('/notifications')
  },

  markNotificationRead(id: string) {
    return request<Notification>(`/notifications/${id}/read`, { method: 'PATCH' })
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
