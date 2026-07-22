import { Activity as ActivityIcon, AlertTriangle, Bell, CalendarDays, ChartNoAxesCombined, ChevronDown, ClipboardList, Download, FlaskConical, HeartPulse, Hospital, House, Info, LogOut, PackageSearch, Pencil, Pill, Plus, ReceiptText, RefreshCw, Search, Settings, Stethoscope, UserCheck, Users, X, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type Appointment as ApiAppointment, type AppointmentStatus, type BillingOverview, type ClinicalHistory, type Consultation, type InventoryOverview, type LaboratoryOverview, type Patient as ApiPatient, type PatientCreateRequest, type PatientUpdateRequest, type PharmacyOverview, type Professional, type ReportsOverview, type Specialty } from './api'
import type { Notification as ApiNotification } from './api'
import { useAuth } from './auth/auth-context'
import { isViewKey, PERMISSIONS, viewPermissions, type ViewKey } from './auth/permissions'
import { ClinicalOperationsView } from './ClinicalOperationsView'
import { OperationalView, type OperationalModule } from './OperationalView'
import './App.css'

type Tone = 'amber' | 'blue' | 'green'
type UiStatus = 'En espera' | 'Confirmada' | 'Atendida' | 'Cancelada' | 'Reprogramada' | 'No asistió'

type Appointment = {
  id: string
  appointmentCode: string
  patientId: string
  time: string
  date: string
  patient: string
  initials: string
  specialty: string
  doctor: string
  status: UiStatus
  tone: Tone
  rawStatus: AppointmentStatus
}

type Patient = {
  id: string
  code: string
  name: string
  document: string
  age: number
  lastVisit: string
  service: string
  status: string
  tone: Tone
}

type DashboardData = {
  reports: ReportsOverview | null
  laboratory: LaboratoryOverview | null
  pharmacy: PharmacyOverview | null
  inventory: InventoryOverview | null
  billing: BillingOverview | null
}

const emptyDashboardData: DashboardData = {
  reports: null,
  laboratory: null,
  pharmacy: null,
  inventory: null,
  billing: null,
}

const navigation: { label: string; key: ViewKey; icon: LucideIcon }[] = [
  { label: 'Inicio', key: 'inicio', icon: House },
  { label: 'Pacientes', key: 'pacientes', icon: Users },
  { label: 'Agenda y citas', key: 'agenda', icon: CalendarDays },
  { label: 'Historia clínica', key: 'historia', icon: Stethoscope },
  { label: 'Triaje', key: 'triaje', icon: ActivityIcon },
  { label: 'Hospitalización', key: 'hospitalizacion', icon: Hospital },
  { label: 'Laboratorio', key: 'laboratorio', icon: FlaskConical },
  { label: 'Farmacia', key: 'farmacia', icon: Pill },
  { label: 'Inventario', key: 'inventario', icon: PackageSearch },
  { label: 'Facturación', key: 'facturacion', icon: ReceiptText },
]

const managementNavigation: { label: string; key: ViewKey; icon: LucideIcon }[] = [
  { label: 'Reportes', key: 'reportes', icon: ChartNoAxesCombined },
  { label: 'Administración', key: 'administracion', icon: Settings },
]

function Icon({ symbol: Symbol }: { symbol: LucideIcon }) {
  return <Symbol className="icon" aria-hidden="true" />
}

function Workspace() {
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()
  const { view } = useParams<{ view: string }>()
  const requestedView = isViewKey(view) ? view : 'inicio'
  const activeView = hasPermission(viewPermissions[requestedView]) ? requestedView : 'inicio'
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientTotal, setPatientTotal] = useState(0)
  const [patientPages, setPatientPages] = useState(0)
  const [patientPage, setPatientPage] = useState(0)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [search, setSearch] = useState('')
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [showPatientEditModal, setShowPatientEditModal] = useState(false)
  const [patientBeingEdited, setPatientBeingEdited] = useState<ApiPatient | null>(null)
  const [historyPatientId, setHistoryPatientId] = useState('')
  const [agendaDate, setAgendaDate] = useState(() => new Date())
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>(emptyDashboardData)
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [backendStatus, setBackendStatus] = useState<'loading' | 'online' | 'offline'>('loading')

  const canReadPatients = hasPermission(PERMISSIONS.PATIENT_READ)
  const canReadAppointments = hasPermission(PERMISSIONS.APPOINTMENT_READ)
  const canWritePatients = hasPermission(PERMISSIONS.PATIENT_WRITE)
  const canWriteAppointments = hasPermission(PERMISSIONS.APPOINTMENT_WRITE)
  const canWriteClinical = hasPermission(PERMISSIONS.CLINICAL_WRITE)
  const canWriteTriage = hasPermission(PERMISSIONS.TRIAGE_WRITE)
  const canWriteHospitalization = hasPermission(PERMISSIONS.HOSPITALIZATION_WRITE)
  const visibleNavigation = useMemo(() => navigation.filter((item) => hasPermission(viewPermissions[item.key])), [hasPermission])
  const visibleManagementNavigation = useMemo(() => managementNavigation.filter((item) => hasPermission(viewPermissions[item.key])), [hasPermission])

  const setActiveView = useCallback((nextView: ViewKey) => {
    if (!hasPermission(viewPermissions[nextView])) {
      setToast('Tu perfil no tiene acceso a este módulo')
      return
    }
    navigate(`/app/${nextView}`)
  }, [hasPermission, navigate])

  useEffect(() => {
    if (!isViewKey(view) || requestedView !== activeView) navigate('/app/inicio', { replace: true })
  }, [activeView, navigate, requestedView, view])

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }, [])

  const loadNotifications = useCallback(async () => {
    try { setNotifications(await api.getNotifications()) } catch { setNotifications([]) }
  }, [])

  useEffect(() => { void loadNotifications() }, [loadNotifications])

  const readNotification = async (id: string) => {
    try {
      const updated = await api.markNotificationRead(id)
      setNotifications((current) => current.map((item) => item.id === id ? updated : item))
    } catch (reason) { notify(getErrorMessage(reason)) }
  }

  const loadPatients = useCallback(async (term: string, page: number) => {
    if (!canReadPatients) {
      setLoadingPatients(false)
      return
    }
    setLoadingPatients(true)
    try {
      const response = await api.getPatients(term, page, 20)
      const content = asArray(response.content)
      setPatients(content.map(toPatientRow))
      setPatientTotal(response.totalElements ?? content.length)
      setPatientPages(response.totalPages ?? (content.length ? 1 : 0))
      setHistoryPatientId((current) => current || content[0]?.id || '')
      setBackendStatus('online')
      setError('')
    } catch (reason) {
      setBackendStatus('offline')
      setError(getErrorMessage(reason))
    } finally {
      setLoadingPatients(false)
    }
  }, [canReadPatients])

  useEffect(() => {
    if (!canReadPatients) return
    const timer = window.setTimeout(() => void loadPatients(search, patientPage), 250)
    return () => window.clearTimeout(timer)
  }, [canReadPatients, loadPatients, patientPage, search])

  useEffect(() => {
    let mounted = true

    const loadReferences = async () => {
      if (!canReadAppointments && !canWriteClinical) return
      try {
        const [specialtyResponse, professionalResponse] = await Promise.all([
          api.getSpecialties(),
          api.getProfessionals(),
        ])
        if (mounted) {
          setSpecialties(asArray(specialtyResponse))
          setProfessionals(asArray(professionalResponse))
          setBackendStatus('online')
          setError('')
        }
      } catch (reason) {
        if (mounted) {
          setBackendStatus('offline')
          setError(getErrorMessage(reason))
        }
      }
    }

    void loadReferences()
    return () => { mounted = false }
  }, [canReadAppointments, canWriteClinical])

  const agendaFilters = useMemo(() => dayFilters(agendaDate), [agendaDate])

  const loadAppointments = useCallback(async (filters: { from?: string; to?: string } = {}) => {
    if (!canReadAppointments) {
      setLoadingAppointments(false)
      return
    }
    setLoadingAppointments(true)
    try {
      const response = await api.getAppointments(0, 50, filters)
      const hydrated = await hydrateAppointments(asArray(response.content), patients, specialties, professionals)
      setAppointments(hydrated)
      setBackendStatus('online')
      setError('')
    } catch (reason) {
      setBackendStatus('offline')
      setError(getErrorMessage(reason))
    } finally {
      setLoadingAppointments(false)
    }
  }, [canReadAppointments, patients, professionals, specialties])

  useEffect(() => {
    if (canReadAppointments) void loadAppointments(agendaFilters)
  }, [agendaFilters, canReadAppointments, loadAppointments])

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true)
    const responses = await Promise.allSettled([
      hasPermission(PERMISSIONS.REPORT_READ) ? api.getReportsOverview() : Promise.resolve(null),
      hasPermission(PERMISSIONS.LAB_READ) ? api.getLaboratoryOverview() : Promise.resolve(null),
      hasPermission(PERMISSIONS.PHARMACY_READ) ? api.getPharmacyOverview() : Promise.resolve(null),
      hasPermission(PERMISSIONS.INVENTORY_READ) ? api.getInventoryOverview() : Promise.resolve(null),
      hasPermission(PERMISSIONS.BILLING_READ) ? api.getBillingOverview() : Promise.resolve(null),
    ])
    setDashboardData({
      reports: fulfilledValue(responses[0]),
      laboratory: fulfilledValue(responses[1]),
      pharmacy: fulfilledValue(responses[2]),
      inventory: fulfilledValue(responses[3]),
      billing: fulfilledValue(responses[4]),
    })
    setBackendStatus(responses.some((response) => response.status === 'fulfilled') ? 'online' : 'offline')
    setLoadingDashboard(false)
  }, [hasPermission])

  useEffect(() => { void loadDashboard() }, [loadDashboard])

  const markArrival = async (id: string) => {
    if (!canWriteAppointments) return
    try {
      await api.registerArrival(id)
      setAppointments((current) => current.map((appointment) => appointment.id === id
        ? { ...appointment, status: 'En espera', tone: 'amber', rawStatus: 'ARRIVED' }
        : appointment))
      notify('Llegada registrada correctamente')
    } catch (reason) {
      notify(getErrorMessage(reason))
    }
  }

  const createPatient = async (payload: PatientCreateRequest) => {
    if (!canWritePatients) return
    try {
      const created = await api.createPatient(payload)
      setShowPatientModal(false)
      setSearch('')
      setPatientPage(0)
      notify(`Paciente ${created.patientCode} registrado correctamente`)
      await loadPatients('', 0)
    } catch (reason) {
      notify(getErrorMessage(reason))
    }
  }

  const editPatient = async (id: string) => {
    if (!canWritePatients) return
    try {
      setPatientBeingEdited(await api.getPatient(id))
      setShowPatientEditModal(true)
    } catch (reason) {
      notify(getErrorMessage(reason))
    }
  }

  const updatePatient = async (id: string, payload: PatientUpdateRequest) => {
    if (!canWritePatients) return
    try {
      await api.updatePatient(id, payload)
      setShowPatientEditModal(false)
      setPatientBeingEdited(null)
      notify('Paciente actualizado correctamente')
      await loadPatients(search, patientPage)
    } catch (reason) {
      notify(getErrorMessage(reason))
    }
  }

  const createAppointment = async (payload: AppointmentForm) => {
    if (!canWriteAppointments) return
    try {
      await api.createAppointment({
        patientId: payload.patientId,
        professionalId: payload.professionalId,
        specialtyId: payload.specialtyId,
        startsAt: toIsoDateTime(payload.date, payload.time),
        endsAt: toIsoDateTime(payload.date, addMinutes(payload.time, 30)),
        reason: payload.reason || undefined,
        idempotencyKey: crypto.randomUUID(),
      })
      setShowAppointmentModal(false)
      notify('Cita creada correctamente')
      await loadAppointments(agendaFilters)
    } catch (reason) {
      notify(getErrorMessage(reason))
    }
  }

  if (!user) return null

  const currentTitle = activeView === 'inicio'
    ? 'Resumen operativo'
    : navigation.concat(managementNavigation).find((item) => item.key === activeView)?.label ?? 'SIIH'
  const todayLabel = formatDate(new Date())
  const waitingAppointments = appointments.filter((appointment) => appointment.status === 'En espera').length
  const completedAppointments = appointments.filter((appointment) => appointment.status === 'Atendida').length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><HeartPulse aria-hidden="true" /></div>
          <div><strong>SIIH</strong><span>Hospital Universitario San Andrés</span></div>
        </div>

        <div className="workspace-label">Módulos</div>
        <nav className="main-nav" aria-label="Navegación principal">
          {visibleNavigation.map((item) => (
            <button className={`nav-item ${activeView === item.key ? 'active' : ''}`} key={item.key} type="button" onClick={() => setActiveView(item.key)}>
              <Icon symbol={item.icon} /><span>{item.label}</span>{item.key === 'pacientes' && patientTotal > 0 && <span className="nav-count">{patientTotal > 99 ? '99+' : patientTotal}</span>}
            </button>
          ))}
        </nav>

        <div className="workspace-label management-label">Gestión</div>
        <nav className="main-nav" aria-label="Navegación de gestión">
          {visibleManagementNavigation.map((item) => (
            <button className={`nav-item ${activeView === item.key ? 'active' : ''}`} key={item.key} type="button" onClick={() => setActiveView(item.key)}>
              <Icon symbol={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer"><div className={`system-status ${backendStatus === 'offline' ? 'system-status-offline' : ''}`}><span></span>{backendStatus === 'loading' ? 'Conectando con el backend...' : backendStatus === 'online' ? 'Backend conectado' : 'Backend no disponible'}</div></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>SIIH</span><span>/</span><strong>{currentTitle}</strong></div>
          <div className="topbar-actions">
            <div className="topbar-date"><span className="date-dot"></span>{todayLabel}</div>
            <div className="notification-wrap">
              <button className="icon-button notification-button" type="button" aria-label="Ver notificaciones" title="Notificaciones" aria-expanded={showNotifications} onClick={() => setShowNotifications((current) => !current)}><Icon symbol={Bell} />{notifications.some((item) => !item.readAt) && <span className="notification-dot" />}</button>
              {showNotifications && <div className="notification-dropdown"><div className="notification-heading"><strong>Notificaciones</strong><button type="button" onClick={() => void loadNotifications()}><RefreshCw aria-hidden="true" /></button></div><div className="notification-list">{notifications.length === 0 ? <span className="notification-empty">No tienes notificaciones.</span> : notifications.slice(0, 8).map((item) => <button type="button" className={item.readAt ? 'notification-item notification-read' : 'notification-item'} key={item.id} onClick={() => void readNotification(item.id)}><i /><span><strong>{item.message}</strong><small>{formatShortDateTime(item.createdAt)}</small></span></button>)}</div></div>}
            </div>
            <div className="user-menu-wrap">
              <button className="user-menu" type="button" aria-expanded={showUserMenu} onClick={() => setShowUserMenu((current) => !current)}>
                <div className="avatar avatar-navy">{initials(user.displayName)}</div><div className="user-copy"><strong>{user.displayName}</strong><span>{user.roleLabel}</span></div><ChevronDown className="chevron" aria-hidden="true" />
              </button>
              {showUserMenu && <div className="user-dropdown"><div><strong>{user.department}</strong><span>@{user.username}</span></div><button type="button" onClick={() => { void logout().finally(() => navigate('/')) }}><LogOut aria-hidden="true" /> Cerrar sesión</button></div>}
            </div>
          </div>
        </header>

        <div className="content-wrap">
          {error && <div className="connection-banner" role="alert"><strong>Backend:</strong> {error}<button type="button" onClick={() => { void loadPatients(search, patientPage); void loadAppointments(agendaFilters); void loadDashboard() }}>Reintentar</button></div>}
          {activeView === 'inicio' && <Dashboard userName={firstName(user.displayName)} appointments={appointments} patientTotal={patientTotal} waitingAppointments={waitingAppointments} completedAppointments={completedAppointments} data={dashboardData} loading={loadingAppointments || loadingDashboard} canCreateAppointment={canWriteAppointments} canExport={hasPermission(PERMISSIONS.REPORT_EXPORT)} onMarkArrival={markArrival} onNewAppointment={() => setShowAppointmentModal(true)} onExport={() => { exportDashboardSummary(dashboardData, appointments, patientTotal); notify('Resumen exportado en formato CSV') }} onGoTo={setActiveView} />}
          {activeView === 'pacientes' && <PatientsView patients={patients} search={search} page={patientPage} totalPages={patientPages} totalElements={patientTotal} loading={loadingPatients} canWrite={canWritePatients} onSearchChange={(value) => { setSearch(value); setPatientPage(0) }} onPageChange={setPatientPage} onNewPatient={() => setShowPatientModal(true)} onEditPatient={editPatient} />}
          {activeView === 'agenda' && <AgendaView appointments={appointments} selectedDate={agendaDate} loading={loadingAppointments} canWrite={canWriteAppointments} onDateChange={(offset) => setAgendaDate((current) => addDays(current, offset))} onMarkArrival={markArrival} onCancel={async (id, reason) => { try { await api.cancelAppointment(id, reason); notify('Cita cancelada correctamente'); await loadAppointments(agendaFilters); return true } catch (failure) { notify(getErrorMessage(failure)); return false } }} onNewAppointment={() => setShowAppointmentModal(true)} />}
          {activeView === 'historia' && <ClinicalHistoryView patients={patients} professionals={professionals} appointments={appointments} selectedPatientId={historyPatientId} canWrite={canWriteClinical} onPatientChange={setHistoryPatientId} onNotify={notify} />}
          {activeView === 'triaje' && <ClinicalOperationsView module="triaje" canWrite={canWriteTriage} onNotify={notify} />}
          {activeView === 'hospitalizacion' && <ClinicalOperationsView module="hospitalizacion" canWrite={canWriteHospitalization} onNotify={notify} />}
          {isOperationalModule(activeView) && <OperationalView module={activeView} onNotify={notify} canExport={hasPermission(PERMISSIONS.REPORT_EXPORT)} />}
        </div>
      </main>

      {showAppointmentModal && canWriteAppointments && <AppointmentModal patients={patients} specialties={specialties} professionals={professionals} onClose={() => setShowAppointmentModal(false)} onSave={createAppointment} />}
      {showPatientModal && canWritePatients && <PatientModal onClose={() => setShowPatientModal(false)} onSave={createPatient} />}
      {showPatientEditModal && canWritePatients && patientBeingEdited && <PatientEditModal patient={patientBeingEdited} onClose={() => { setShowPatientEditModal(false); setPatientBeingEdited(null) }} onSave={updatePatient} />}
      {toast && <div className="toast" role="status"><span className="toast-check">✓</span>{toast}</div>}
    </div>
  )
}

type DashboardProps = {
  userName: string
  appointments: Appointment[]
  patientTotal: number
  waitingAppointments: number
  completedAppointments: number
  data: DashboardData
  loading: boolean
  canCreateAppointment: boolean
  canExport: boolean
  onMarkArrival: (id: string) => Promise<void>
  onNewAppointment: () => void
  onExport: () => void
  onGoTo: (view: ViewKey) => void
}

function Dashboard({ userName, appointments, patientTotal, waitingAppointments, completedAppointments, data, loading, canCreateAppointment, canExport, onMarkArrival, onNewAppointment, onExport, onGoTo }: DashboardProps) {
  const reportSummary = data.reports?.summary
  const specialties = asArray(data.reports?.appointmentsBySpecialty).slice(0, 6)
  const maxSpecialtyCount = Math.max(1, ...specialties.map((item) => item.count ?? 0))
  const recentActivity = asArray(data.reports?.recentActivity).slice(0, 5)
  const pendingPrescriptions = asArray(data.pharmacy?.prescriptions).filter((prescription) => !['DISPENSED', 'CANCELLED'].includes(prescription.status)).length

  return <>
    <section className="page-heading">
      <div><span className="eyebrow">Panel de control</span><h1>Buenos días, {userName}</h1><p>Estado operativo consolidado desde el sistema hospitalario.</p></div>
      <div className="heading-actions">
        {canExport && <button className="button button-secondary" type="button" onClick={onExport}><Icon symbol={Download} /> Exportar resumen</button>}
        {canCreateAppointment && <button className="button button-primary" type="button" onClick={onNewAppointment}><Icon symbol={Plus} /> Nueva cita</button>}
      </div>
    </section>
    <section className="metric-grid" aria-label="Indicadores del sistema">
      <MetricCard label="Pacientes activos" value={(reportSummary?.activePatients ?? patientTotal).toLocaleString('es-BO')} change="API" detail="registro consolidado" icon={Users} tone="blue" />
      <MetricCard label="Citas activas" value={(reportSummary?.activeAppointments ?? appointments.length).toLocaleString('es-BO')} change="Hoy" detail={`${waitingAppointments} en espera`} icon={CalendarDays} tone="teal" />
      <MetricCard label="Órdenes pendientes" value={formatMetric(data.laboratory?.summary?.pendingOrders)} change="Lab" detail="por procesar" icon={FlaskConical} tone="amber" />
      <MetricCard label="Consultas registradas" value={(reportSummary?.consultations ?? completedAppointments).toLocaleString('es-BO')} change="Clínica" detail="atenciones acumuladas" icon={ClipboardList} tone="green" />
    </section>
    <section className="content-grid dashboard-grid">
      <div className="panel appointments-panel">
        <PanelHeader title="Agenda del día" meta={`${appointments.length} citas devueltas por el backend`} action="Ver agenda completa" onAction={() => onGoTo('agenda')} />
        <div className="table-wrap"><table><thead><tr><th>Hora</th><th>Paciente</th><th>Especialidad</th><th>Profesional</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{loading ? <LoadingRow colSpan={6} /> : appointments.length === 0 ? <EmptyRow colSpan={6} text="No hay citas registradas para esta fecha." /> : appointments.slice(0, 5).map((appointment) => <AppointmentTableRow key={appointment.id} appointment={appointment} canWrite={canCreateAppointment} onMarkArrival={onMarkArrival} />)}</tbody></table></div>
        <div className="panel-footer"><span>Datos actualizados desde la API</span><button type="button" className="text-button" onClick={() => onGoTo('agenda')}>Ver todas las citas <span>→</span></button></div>
      </div>
      <div className="panel activity-panel">
        <PanelHeader title="Actividad reciente" meta="Eventos operativos" />
        <div className="activity-list">{recentActivity.map((item) => <Activity key={`${item.type}-${item.code}-${item.occurredAt}`} icon="✓" tone={statusTone(item.status)} title={humanize(item.type)} description={`${item.code} · ${humanize(item.status)}`} time={formatShortDateTime(item.occurredAt)} />)}{!loading && recentActivity.length === 0 && <div className="empty-inline">No hay actividad reciente para mostrar.</div>}</div>
        <div className="panel-footer"><button type="button" className="text-button" onClick={() => onGoTo('reportes')}>Abrir reportes <span>→</span></button></div>
      </div>
    </section>
    <section className="content-grid lower-grid">
      <div className="panel chart-panel">
        <PanelHeader title="Citas por especialidad" meta="Demanda consolidada desde reportes" />
        {specialties.length === 0 ? <div className="empty-inline report-empty">No hay datos agregados por especialidad.</div> : <div className="report-bars">{specialties.map((item) => <div className="report-bar-row" key={item.specialty}><span>{item.specialty || 'Sin especialidad'}</span><div><i style={{ width: `${Math.max(5, ((item.count ?? 0) / maxSpecialtyCount) * 100)}%` }} /></div><strong>{item.count ?? 0}</strong></div>)}</div>}
      </div>
      <div className="panel alerts-panel">
        <PanelHeader title="Alertas operativas" meta="Prioridades de seguimiento" />
        <div className="alert-list">
          <Alert tone={(data.inventory?.summary?.lowStockLines ?? 0) > 0 ? 'warning' : 'neutral'} title="Stock bajo" description={`${formatMetric(data.inventory?.summary?.lowStockLines)} líneas requieren reposición.`} action="Abrir inventario" onAction={() => onGoTo('inventario')} />
          <Alert tone={pendingPrescriptions > 0 ? 'warning' : 'neutral'} title="Recetas por dispensar" description={`${pendingPrescriptions} recetas vigentes en la vista de farmacia.`} action="Abrir farmacia" onAction={() => onGoTo('farmacia')} />
          <Alert tone={(data.billing?.summary?.pendingAmount ?? 0) > 0 ? 'critical' : 'neutral'} title="Cobros pendientes" description={`${formatMoney(data.billing?.summary?.pendingAmount)} pendientes de conciliación.`} action="Abrir facturación" onAction={() => onGoTo('facturacion')} />
        </div>
      </div>
    </section>
  </>
}

function MetricCard({ label, value, change, detail, icon, tone }: { label: string; value: string; change: string; detail: string; icon: LucideIcon; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon metric-${tone}`}><Icon symbol={icon} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small><b className={tone === 'amber' ? 'negative' : ''}>{change}</b> {detail}</small></div></article>
}

function PanelHeader({ title, meta, action, onAction, children }: { title: string; meta?: string; action?: string; onAction?: () => void; children?: ReactNode }) {
  return <div className="panel-header"><div><h2>{title}</h2>{meta && <span>{meta}</span>}</div>{children ?? (action && <button type="button" className="text-button" onClick={onAction}>{action} <span>→</span></button>)}</div>
}

function StatusPill({ tone, label }: { tone: string; label: string }) {
  return <span className={`status-pill status-${tone}`}><i></i>{label}</span>
}

function Activity({ icon, tone, title, description, time }: { icon: string; tone: string; title: string; description: string; time: string }) {
  return <div className="activity-item"><div className={`activity-icon activity-${tone}`}>{icon}</div><div><strong>{title}</strong><span>{description}</span></div><time>{time}</time></div>
}

function Alert({ tone, title, description, action, onAction }: { tone: string; title: string; description: string; action: string; onAction: () => void }) {
  const AlertIcon = tone === 'critical' || tone === 'warning' ? AlertTriangle : Info
  return <div className="alert-item"><div className={`alert-icon alert-${tone}`}><AlertIcon aria-hidden="true" /></div><div className="alert-copy"><strong>{title}</strong><span>{description}</span><button type="button" className="text-button" onClick={onAction}>{action} <span>→</span></button></div></div>
}

function AppointmentTableRow({ appointment, canWrite, onMarkArrival }: { appointment: Appointment; canWrite: boolean; onMarkArrival: (id: string) => Promise<void> }) {
  const canRegisterArrival = canWrite && ['SCHEDULED', 'CONFIRMED'].includes(appointment.rawStatus)
  return <tr><td className="time-cell">{appointment.time}</td><td><div className="person-cell"><div className={`avatar avatar-${appointment.tone}`}>{appointment.initials}</div><div><strong>{appointment.patient}</strong><span>{appointment.appointmentCode}</span></div></div></td><td>{appointment.specialty}</td><td>{appointment.doctor}</td><td><StatusPill tone={appointment.tone} label={appointment.status} /></td><td>{canRegisterArrival && <button className="row-action" type="button" title="Registrar llegada" aria-label={`Registrar llegada de ${appointment.patient}`} onClick={() => void onMarkArrival(appointment.id)}><UserCheck aria-hidden="true" /></button>}</td></tr>
}

function PatientsView({ patients, search, page, totalPages, totalElements, loading, canWrite, onSearchChange, onPageChange, onNewPatient, onEditPatient }: { patients: Patient[]; search: string; page: number; totalPages: number; totalElements: number; loading: boolean; canWrite: boolean; onSearchChange: (value: string) => void; onPageChange: (page: number) => void; onNewPatient: () => void; onEditPatient: (id: string) => Promise<void> }) {
  return <>
    <section className="page-heading compact-heading">
      <div><span className="eyebrow">Admisión y registro</span><h1>Pacientes</h1><p>Consulta y actualiza la ficha única de pacientes.</p></div>
      {canWrite && <button className="button button-primary" type="button" onClick={onNewPatient}><Icon symbol={Plus} /> Registrar paciente</button>}
    </section>
    <section className="panel directory-panel">
      <div className="directory-toolbar"><div className="search-field large-search"><Icon symbol={Search} /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por nombre, documento o código" aria-label="Buscar pacientes" />{search && <button type="button" aria-label="Limpiar búsqueda" title="Limpiar búsqueda" onClick={() => onSearchChange('')}><X aria-hidden="true" /></button>}</div></div>
      <div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Documento</th><th>Edad</th><th>Última atención</th><th>Servicio</th><th>Estado</th><th></th></tr></thead><tbody>{loading ? <LoadingRow colSpan={7} /> : patients.length === 0 ? <EmptyRow colSpan={7} text="No encontramos pacientes en el backend." /> : patients.map((patient) => <tr key={patient.id}><td><div className="person-cell"><div className="avatar avatar-soft">{initials(patient.name)}</div><div><strong>{patient.name}</strong><span>{patient.code}</span></div></div></td><td>{patient.document}</td><td>{patient.age} años</td><td>{patient.lastVisit}</td><td>{patient.service}</td><td><StatusPill tone={patient.tone} label={patient.status} /></td><td>{canWrite && <button className="row-action" type="button" title="Editar ficha" aria-label={`Editar ficha de ${patient.name}`} onClick={() => void onEditPatient(patient.id)}><Pencil aria-hidden="true" /></button>}</td></tr>)}</tbody></table></div>
      <div className="panel-footer"><span>Mostrando {patients.length} de {totalElements} pacientes</span><div className="pagination"><button type="button" aria-label="Página anterior" disabled={page === 0 || loading} onClick={() => onPageChange(page - 1)}>←</button><span>{totalPages === 0 ? '0 / 0' : `${page + 1} / ${totalPages}`}</span><button type="button" aria-label="Página siguiente" disabled={loading || totalPages === 0 || page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>→</button></div></div>
    </section>
  </>
}

function AgendaView({ appointments, selectedDate, loading, canWrite, onDateChange, onMarkArrival, onCancel, onNewAppointment }: { appointments: Appointment[]; selectedDate: Date; loading: boolean; canWrite: boolean; onDateChange: (offset: number) => void; onMarkArrival: (id: string) => Promise<void>; onCancel: (id: string, reason: string) => Promise<boolean>; onNewAppointment: () => void }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const visibleAppointments = appointments.filter((appointment) => filter === 'all'
    || (filter === 'pending' && appointment.status !== 'Atendida' && appointment.status !== 'Cancelada')
    || (filter === 'completed' && appointment.status === 'Atendida'))
  const waiting = appointments.filter((appointment) => appointment.status === 'En espera').length
  const completed = appointments.filter((appointment) => appointment.status === 'Atendida').length

  return <>
    <section className="page-heading compact-heading"><div><span className="eyebrow">Planificación de atención</span><h1>Agenda y citas</h1><p>{formatDate(selectedDate)} · Consulta externa</p></div>{canWrite && <button className="button button-primary" type="button" onClick={onNewAppointment}><Icon symbol={Plus} /> Nueva cita</button>}</section>
    <section className="agenda-summary"><div className="day-selector"><button type="button" aria-label="Día anterior" onClick={() => onDateChange(-1)}>←</button><strong>{isToday(selectedDate) ? 'Hoy' : formatShortDay(selectedDate)} <span>{selectedDate.getDate()}</span></strong><button type="button" aria-label="Día siguiente" onClick={() => onDateChange(1)}>→</button></div><div className="agenda-summary-stats"><span><b>{appointments.length}</b> citas</span><span><b>{waiting.toString().padStart(2, '0')}</b> en espera</span><span><b>{completed}</b> atendidas</span></div></section>
    <section className="panel agenda-panel"><PanelHeader title="Citas cargadas" meta="Ordenadas por hora"><div className="segmented-control"><button className={filter === 'all' ? 'selected' : ''} type="button" onClick={() => setFilter('all')}>Todas</button><button className={filter === 'pending' ? 'selected' : ''} type="button" onClick={() => setFilter('pending')}>Pendientes</button><button className={filter === 'completed' ? 'selected' : ''} type="button" onClick={() => setFilter('completed')}>Atendidas</button></div></PanelHeader><div className="agenda-list">{loading ? <div className="empty-state"><strong>Cargando agenda...</strong></div> : visibleAppointments.length === 0 ? <div className="empty-state"><strong>No hay citas para mostrar</strong><span>Las citas creadas en el backend aparecerán aquí.</span></div> : visibleAppointments.map((appointment) => {
      const mayArrive = canWrite && ['SCHEDULED', 'CONFIRMED'].includes(appointment.rawStatus)
      const mayCancel = canWrite && ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'].includes(appointment.rawStatus)
      return <div className="agenda-row" key={appointment.id}><div className="agenda-time">{appointment.time}<span>30 min</span></div><div className="agenda-line"></div><div className={`avatar avatar-${appointment.tone}`}>{appointment.initials}</div><div className="agenda-patient"><strong>{appointment.patient}</strong><span>{appointment.specialty} · {appointment.doctor}</span></div><StatusPill tone={appointment.tone} label={appointment.status} />{(mayArrive || mayCancel) && <div className="agenda-actions">{mayArrive && <button type="button" className="button button-small button-secondary" onClick={() => void onMarkArrival(appointment.id)}>Registrar llegada</button>}{mayCancel && <button type="button" className="button button-small button-danger" onClick={() => setAppointmentToCancel(appointment)}>Cancelar</button>}</div>}</div>
    })}</div></section>
    {appointmentToCancel && <AppointmentCancelModal appointment={appointmentToCancel} onClose={() => setAppointmentToCancel(null)} onConfirm={async (reason) => { const cancelled = await onCancel(appointmentToCancel.id, reason); if (cancelled) setAppointmentToCancel(null) }} />}
  </>
}

function AppointmentCancelModal({ appointment, onClose, onConfirm }: { appointment: Appointment; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reason.trim()) return
    setSaving(true)
    try { await onConfirm(reason.trim()) } finally { setSaving(false) }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-appointment-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="modal-header"><div><span className="eyebrow">{appointment.appointmentCode}</span><h2 id="cancel-appointment-title">Cancelar cita</h2></div><button type="button" className="close-button" title="Cerrar" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></button></div><div className="cancel-appointment-copy"><strong>{appointment.patient}</strong><span>{appointment.date} a las {appointment.time} · {appointment.specialty}</span><p>La cancelación quedará registrada en la auditoría y no elimina la cita.</p></div><div className="form-grid single-column"><label>Motivo de cancelación<textarea autoFocus required minLength={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe el motivo para conservar la trazabilidad" /></label></div><div className="modal-footer"><button type="button" className="button button-secondary" disabled={saving} onClick={onClose}>Volver</button><button type="submit" className="button button-danger" disabled={saving || reason.trim().length < 3}>{saving ? 'Cancelando...' : 'Confirmar cancelación'}</button></div></form></div>
}

type HistoryFields = Pick<ClinicalHistory, 'background' | 'allergies' | 'familyHistory' | 'surgicalHistory' | 'relevantNotes'>

function ClinicalHistoryView({ patients, professionals, appointments, selectedPatientId, canWrite, onPatientChange, onNotify }: { patients: Patient[]; professionals: Professional[]; appointments: Appointment[]; selectedPatientId: string; canWrite: boolean; onPatientChange: (id: string) => void; onNotify: (message: string) => void }) {
  const [history, setHistory] = useState<ClinicalHistory | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [consultationDetail, setConsultationDetail] = useState<Consultation | null>(null)
  const [historyFields, setHistoryFields] = useState<HistoryFields>(emptyHistoryFields())
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [evolution, setEvolution] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? '')
  const [appointmentId, setAppointmentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingHistory, setSavingHistory] = useState(false)
  const [creatingConsultation, setCreatingConsultation] = useState(false)
  const [showConsultationForm, setShowConsultationForm] = useState(false)
  const [consultationToClose, setConsultationToClose] = useState<Consultation | null>(null)
  const [viewError, setViewError] = useState('')
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId)
  const patientAppointments = appointments.filter((appointment) => appointment.patientId === selectedPatientId && !['CANCELLED', 'NO_SHOW'].includes(appointment.rawStatus))

  useEffect(() => {
    if (!selectedPatientId) return
    let mounted = true
    setLoading(true)
    setViewError('')
    Promise.allSettled([api.getClinicalHistory(selectedPatientId), api.getPatientConsultations(selectedPatientId)]).then(([historyResult, consultationResult]) => {
      if (!mounted) return
      if (historyResult.status === 'fulfilled') {
        setHistory(historyResult.value)
        setHistoryFields({ background: historyResult.value.background ?? '', allergies: historyResult.value.allergies ?? '', familyHistory: historyResult.value.familyHistory ?? '', surgicalHistory: historyResult.value.surgicalHistory ?? '', relevantNotes: historyResult.value.relevantNotes ?? '' })
      } else {
        setHistory(null)
        setHistoryFields(emptyHistoryFields())
      }
      if (consultationResult.status === 'fulfilled') setConsultations(asArray(consultationResult.value))
      else setConsultations([])
      if (historyResult.status === 'rejected' && consultationResult.status === 'rejected') setViewError(getErrorMessage(historyResult.reason))
      setLoading(false)
    })
    return () => { mounted = false }
  }, [selectedPatientId])

  useEffect(() => {
    if (!professionalId && professionals[0]) setProfessionalId(professionals[0].id)
  }, [professionalId, professionals])

  const saveHistory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPatientId || !canWrite) return
    setSavingHistory(true)
    try {
      const saved = await api.updateClinicalHistory(selectedPatientId, historyFields)
      setHistory(saved)
      setHistoryFields({ background: saved.background ?? '', allergies: saved.allergies ?? '', familyHistory: saved.familyHistory ?? '', surgicalHistory: saved.surgicalHistory ?? '', relevantNotes: saved.relevantNotes ?? '' })
      onNotify('Historia clínica actualizada correctamente')
    } catch (reason) {
      onNotify(getErrorMessage(reason))
    } finally {
      setSavingHistory(false)
    }
  }

  const createConsultation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canWrite || !selectedPatientId || !professionalId || !chiefComplaint.trim()) return
    setCreatingConsultation(true)
    try {
      await api.createConsultation({ patientId: selectedPatientId, professionalId, appointmentId: appointmentId || undefined, chiefComplaint, evolution: evolution || undefined, recommendations: recommendations || undefined })
      setChiefComplaint('')
      setEvolution('')
      setRecommendations('')
      setAppointmentId('')
      setShowConsultationForm(false)
      setConsultations(await api.getPatientConsultations(selectedPatientId))
      onNotify('Consulta iniciada correctamente')
    } catch (reason) {
      onNotify(getErrorMessage(reason))
    } finally {
      setCreatingConsultation(false)
    }
  }

  const closeConsultation = async (id: string, payload: { chiefComplaint: string; evolution?: string; diagnosisSummary: string; treatmentPlan: string; recommendations?: string }) => {
    if (!canWrite) return
    try {
      await api.closeConsultation(id, payload)
      setConsultationToClose(null)
      setConsultations(await api.getPatientConsultations(selectedPatientId))
      onNotify('Consulta cerrada correctamente')
    } catch (reason) {
      onNotify(getErrorMessage(reason))
    }
  }

  const openConsultationDetail = async (id: string) => {
    try {
      setConsultationDetail(await api.getConsultation(id))
    } catch (reason) {
      onNotify(getErrorMessage(reason))
    }
  }

  return <>
    <section className="page-heading compact-heading"><div><span className="eyebrow">Atención clínica</span><h1>Historia clínica</h1><p>Antecedentes y consultas obtenidos desde el backend.</p></div><label className="patient-selector">Paciente<select value={selectedPatientId} onChange={(event) => onPatientChange(event.target.value)}>{patients.map((patient) => <option value={patient.id} key={patient.id}>{patient.name} · {patient.code}</option>)}</select></label></section>
    {!selectedPatient ? <section className="module-empty panel"><h2>No hay pacientes para consultar</h2><p>No existen fichas disponibles para este perfil.</p></section> : <>
      <div className="history-patient-summary"><div className="avatar avatar-soft">{initials(selectedPatient.name)}</div><div><strong>{selectedPatient.name}</strong><span>{selectedPatient.code} · {selectedPatient.document} · {selectedPatient.age} años</span></div><StatusPill tone={selectedPatient.tone} label={selectedPatient.status} /></div>
      {viewError && <div className="connection-banner" role="alert">{viewError}</div>}
      <section className="clinical-grid">
        <form className="panel clinical-history-panel" onSubmit={(event) => void saveHistory(event)}>
          <PanelHeader title="Antecedentes" meta={history ? `Actualizada ${formatShortDateTime(history.updatedAt)}` : 'Sin registro previo'} />
          <fieldset className="clinical-form clinical-fieldset" disabled={!canWrite}>
            <label>Antecedentes<textarea value={historyFields.background ?? ''} onChange={(event) => setHistoryFields((current) => ({ ...current, background: event.target.value }))} /></label>
            <label>Alergias<textarea value={historyFields.allergies ?? ''} onChange={(event) => setHistoryFields((current) => ({ ...current, allergies: event.target.value }))} /></label>
            <label>Antecedentes familiares<textarea value={historyFields.familyHistory ?? ''} onChange={(event) => setHistoryFields((current) => ({ ...current, familyHistory: event.target.value }))} /></label>
            <label>Antecedentes quirúrgicos<textarea value={historyFields.surgicalHistory ?? ''} onChange={(event) => setHistoryFields((current) => ({ ...current, surgicalHistory: event.target.value }))} /></label>
            <label>Notas relevantes<textarea value={historyFields.relevantNotes ?? ''} onChange={(event) => setHistoryFields((current) => ({ ...current, relevantNotes: event.target.value }))} /></label>
          </fieldset>
          <div className="panel-footer"><span>{loading ? 'Cargando...' : canWrite ? 'Historia clínica disponible' : 'Consulta en modo lectura'}</span>{canWrite && <button type="submit" className="button button-primary" disabled={savingHistory}>{savingHistory ? 'Guardando...' : 'Guardar historia'}</button>}</div>
        </form>
        <section className="panel consultations-panel">
          <PanelHeader title="Consultas" meta={`${consultations.length} registros`}>{canWrite && <button type="button" className="button button-secondary" disabled={!professionals.length} onClick={() => setShowConsultationForm((current) => !current)}><Icon symbol={Plus} /> Nueva consulta</button>}</PanelHeader>
          {showConsultationForm && canWrite && <form className="consultation-form" onSubmit={(event) => void createConsultation(event)}><label>Profesional<select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>{professionals.map((professional) => <option value={professional.id} key={professional.id}>{professional.displayName}</option>)}</select></label><label>Cita relacionada<select value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)}><option value="">Sin cita</option>{patientAppointments.map((appointment) => <option value={appointment.id} key={appointment.id}>{appointment.appointmentCode} · {appointment.time}</option>)}</select></label><label className="form-span-two">Motivo de consulta<input required value={chiefComplaint} onChange={(event) => setChiefComplaint(event.target.value)} /></label><label className="form-span-two">Evolución<textarea value={evolution} onChange={(event) => setEvolution(event.target.value)} /></label><label className="form-span-two">Recomendaciones<textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} /></label><div className="form-actions form-span-two"><button type="submit" className="button button-primary" disabled={creatingConsultation}>{creatingConsultation ? 'Iniciando...' : 'Iniciar consulta'}</button></div></form>}
          {!loading && consultations.length === 0 ? <div className="empty-state"><strong>No hay consultas registradas</strong><span>Las consultas creadas aparecerán aquí.</span></div> : <div className="consultation-list">{consultations.map((consultation) => <article className="consultation-item" key={consultation.id}><div><button type="button" className="consultation-link" onClick={() => void openConsultationDetail(consultation.id)}>{consultation.consultationCode}</button><span>{formatShortDateTime(consultation.createdAt)} · {consultation.chiefComplaint}</span></div><StatusPill tone={consultation.status === 'CLOSED' ? 'green' : 'amber'} label={consultation.status === 'CLOSED' ? 'Cerrada' : consultation.status === 'DRAFT' ? 'Borrador' : consultation.status} />{canWrite && consultation.status === 'DRAFT' && <button type="button" className="button button-small button-secondary" onClick={() => setConsultationToClose(consultation)}>Cerrar consulta</button>}</article>)}</div>}
          {consultationDetail && <div className="consultation-detail"><div><strong>Detalle {consultationDetail.consultationCode}</strong><button type="button" className="close-button" title="Cerrar detalle" aria-label="Cerrar detalle" onClick={() => setConsultationDetail(null)}><X aria-hidden="true" /></button></div><p><b>Motivo:</b> {consultationDetail.chiefComplaint}</p><p><b>Evolución:</b> {consultationDetail.evolution || 'Sin registrar'}</p><p><b>Diagnóstico:</b> {consultationDetail.diagnosisSummary || 'Pendiente de cierre'}</p><p><b>Tratamiento:</b> {consultationDetail.treatmentPlan || 'Pendiente de cierre'}</p></div>}
        </section>
      </section>
    </>}
    {canWrite && consultationToClose && <ConsultationCloseModal consultation={consultationToClose} onClose={() => setConsultationToClose(null)} onSave={closeConsultation} />}
  </>
}

function PatientEditModal({ patient, onClose, onSave }: { patient: ApiPatient; onClose: () => void; onSave: (id: string, payload: PatientUpdateRequest) => Promise<void> }) {
  const [form, setForm] = useState<PatientUpdateRequest>(() => patientUpdateDefaults(patient))
  const [saving, setSaving] = useState(false)
  const update = <K extends keyof PatientUpdateRequest>(key: K, value: PatientUpdateRequest[K]) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try { await onSave(patient.id, form) } finally { setSaving(false) }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-patient-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="modal-header"><div><span className="eyebrow">Ficha {patient.patientCode}</span><h2 id="edit-patient-title">Editar paciente</h2></div><button type="button" className="close-button" title="Cerrar" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></button></div><div className="form-grid"><label>Primer nombre<input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} /></label><label>Apellido<input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} /></label><label>Fecha de nacimiento<input required type="date" value={form.birthDate} onChange={(event) => update('birthDate', event.target.value)} /></label><label>Sexo<select value={form.sex} onChange={(event) => update('sex', event.target.value as PatientUpdateRequest['sex'])}><option value="NOT_DECLARED">No declarado</option><option value="FEMALE">Femenino</option><option value="MALE">Masculino</option><option value="INTERSEX">Intersexual</option><option value="UNKNOWN">Desconocido</option></select></label><label>Estado<select value={form.status} onChange={(event) => update('status', event.target.value as PatientUpdateRequest['status'])}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="DECEASED">Fallecido</option></select></label><label>Teléfono<input value={form.phone ?? ''} onChange={(event) => update('phone', event.target.value)} /></label><label>Correo electrónico<input type="email" value={form.email ?? ''} onChange={(event) => update('email', event.target.value)} /></label><label>Dirección<input value={form.address ?? ''} onChange={(event) => update('address', event.target.value)} /></label></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></div></form></div>
}

function ConsultationCloseModal({ consultation, onClose, onSave }: { consultation: Consultation; onClose: () => void; onSave: (id: string, payload: { chiefComplaint: string; evolution?: string; diagnosisSummary: string; treatmentPlan: string; recommendations?: string }) => Promise<void> }) {
  const [form, setForm] = useState({ chiefComplaint: consultation.chiefComplaint, evolution: consultation.evolution ?? '', diagnosisSummary: '', treatmentPlan: '', recommendations: consultation.recommendations ?? '' })
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { await onSave(consultation.id, form) } finally { setSaving(false) } }
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="close-consultation-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="modal-header"><div><span className="eyebrow">{consultation.consultationCode}</span><h2 id="close-consultation-title">Cerrar consulta</h2></div><button type="button" className="close-button" title="Cerrar" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></button></div><div className="form-grid"><label className="form-span-two">Motivo de consulta<input required value={form.chiefComplaint} onChange={(event) => setForm((current) => ({ ...current, chiefComplaint: event.target.value }))} /></label><label className="form-span-two">Evolución<textarea value={form.evolution} onChange={(event) => setForm((current) => ({ ...current, evolution: event.target.value }))} /></label><label className="form-span-two">Diagnóstico<input required value={form.diagnosisSummary} onChange={(event) => setForm((current) => ({ ...current, diagnosisSummary: event.target.value }))} /></label><label className="form-span-two">Plan de tratamiento<textarea required value={form.treatmentPlan} onChange={(event) => setForm((current) => ({ ...current, treatmentPlan: event.target.value }))} /></label><label className="form-span-two">Recomendaciones<textarea value={form.recommendations} onChange={(event) => setForm((current) => ({ ...current, recommendations: event.target.value }))} /></label></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Cerrando...' : 'Cerrar consulta'}</button></div></form></div>
}

type AppointmentForm = { patientId: string; specialtyId: string; professionalId: string; date: string; time: string; reason: string }

function AppointmentModal({ patients, specialties, professionals, onClose, onSave }: { patients: Patient[]; specialties: Specialty[]; professionals: Professional[]; onClose: () => void; onSave: (payload: AppointmentForm) => Promise<void> }) {
  const [form, setForm] = useState<AppointmentForm>({ patientId: patients[0]?.id ?? '', specialtyId: specialties[0]?.id ?? '', professionalId: professionals[0]?.id ?? '', date: toDateInput(new Date()), time: nextHalfHour(), reason: '' })
  const [availableProfessionals, setAvailableProfessionals] = useState(professionals)
  const [loadingProfessionals, setLoadingProfessionals] = useState(false)
  const [referenceError, setReferenceError] = useState('')
  const [saving, setSaving] = useState(false)
  const update = <K extends keyof AppointmentForm>(key: K, value: AppointmentForm[K]) => setForm((current) => ({ ...current, [key]: value }))
  const canSave = Boolean(form.patientId && form.specialtyId && form.professionalId && form.date >= toDateInput(new Date()) && form.time)

  useEffect(() => {
    if (!form.specialtyId) return
    let active = true
    setLoadingProfessionals(true)
    setReferenceError('')
    api.getProfessionals(form.specialtyId).then((items) => {
      if (!active) return
      setAvailableProfessionals(items)
      setForm((current) => ({ ...current, professionalId: items.some((item) => item.id === current.professionalId) ? current.professionalId : items[0]?.id ?? '' }))
    }).catch((reason) => {
      if (active) setReferenceError(getErrorMessage(reason))
    }).finally(() => {
      if (active) setLoadingProfessionals(false)
    })
    return () => { active = false }
  }, [form.specialtyId])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="appointment-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="modal-header"><div><span className="eyebrow">Agenda</span><h2 id="appointment-title">Nueva cita</h2></div><button type="button" className="close-button" title="Cerrar" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></button></div><div className="form-grid"><label>Paciente<select required value={form.patientId} onChange={(event) => update('patientId', event.target.value)}><option value="" disabled>Seleccionar paciente</option>{patients.map((patient) => <option value={patient.id} key={patient.id}>{patient.name} · {patient.code}</option>)}</select></label><label>Especialidad<select required value={form.specialtyId} onChange={(event) => update('specialtyId', event.target.value)}><option value="" disabled>Seleccionar especialidad</option>{specialties.map((specialty) => <option value={specialty.id} key={specialty.id}>{specialty.name}</option>)}</select></label><label>Profesional<select required disabled={loadingProfessionals || availableProfessionals.length === 0} value={form.professionalId} onChange={(event) => update('professionalId', event.target.value)}><option value="" disabled>{loadingProfessionals ? 'Consultando disponibilidad...' : 'Seleccionar profesional'}</option>{availableProfessionals.map((professional) => <option value={professional.id} key={professional.id}>{professional.displayName}</option>)}</select></label><label>Fecha<input required min={toDateInput(new Date())} type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></label><label>Hora<input required type="time" value={form.time} onChange={(event) => update('time', event.target.value)} /></label><label>Motivo <span className="optional-label">Opcional</span><input value={form.reason} onChange={(event) => update('reason', event.target.value)} placeholder="Consulta de seguimiento" /></label></div>{referenceError && <p className="modal-error">{referenceError}</p>}{(!patients.length || !specialties.length || (!loadingProfessionals && !availableProfessionals.length)) && <p className="modal-error">Para crear una cita se necesita al menos un paciente, una especialidad y un profesional habilitado para esa especialidad.</p>}<div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={!canSave || saving || loadingProfessionals}>{saving ? 'Guardando...' : 'Confirmar cita'}</button></div></form></div>
}

function PatientModal({ onClose, onSave }: { onClose: () => void; onSave: (payload: PatientCreateRequest) => Promise<void> }) {
  const [form, setForm] = useState<PatientCreateRequest>({ documentType: 'CI', firstName: '', lastName: '', birthDate: '', sex: 'NOT_DECLARED', documentNumber: '', phone: '', email: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)
  const [duplicates, setDuplicates] = useState<ApiPatient[]>([])
  const [error, setError] = useState('')
  const update = <K extends keyof PatientCreateRequest>(key: K, value: PatientCreateRequest[K]) => {
    setDuplicates([])
    setError('')
    setForm((current) => ({ ...current, [key]: value }))
  }
  const canSave = Boolean(form.firstName.trim() && form.lastName.trim() && form.birthDate && form.birthDate <= toDateInput(new Date()) && (form.documentType === 'NONE' || form.documentNumber?.trim()))

  const payload = () => ({ ...form, documentNumber: form.documentType === 'NONE' ? undefined : form.documentNumber || undefined, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined })

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return
    setCheckingDuplicates(true)
    setError('')
    try {
      const matches = await api.findPatientDuplicates({ documentNumber: form.documentNumber, firstName: form.firstName, lastName: form.lastName, birthDate: form.birthDate })
      if (matches.length > 0) {
        setDuplicates(matches)
        return
      }
      setSaving(true)
      await onSave(payload())
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setCheckingDuplicates(false)
      setSaving(false)
    }
  }

  const registerDespiteMatches = async () => {
    setSaving(true)
    setError('')
    try { await onSave(payload()) } catch (reason) { setError(getErrorMessage(reason)) } finally { setSaving(false) }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal patient-modal" role="dialog" aria-modal="true" aria-labelledby="patient-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="modal-header"><div><span className="eyebrow">Admisión y registro</span><h2 id="patient-title">Registrar paciente</h2></div><button type="button" className="close-button" title="Cerrar" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></button></div>{duplicates.length === 0 ? <><div className="form-grid"><label>Tipo de documento<select value={form.documentType} onChange={(event) => update('documentType', event.target.value as PatientCreateRequest['documentType'])}><option value="CI">Cédula de identidad</option><option value="PASSPORT">Pasaporte</option><option value="FOREIGN_ID">Documento extranjero</option><option value="NONE">Sin documento</option></select></label><label>Número de documento<input required={form.documentType !== 'NONE'} disabled={form.documentType === 'NONE'} value={form.documentType === 'NONE' ? '' : form.documentNumber} onChange={(event) => update('documentNumber', event.target.value)} /></label><label>Primer nombre<input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} /></label><label>Apellido paterno<input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} /></label><label>Fecha de nacimiento<input required max={toDateInput(new Date())} type="date" value={form.birthDate} onChange={(event) => update('birthDate', event.target.value)} /></label><label>Sexo<select value={form.sex} onChange={(event) => update('sex', event.target.value as PatientCreateRequest['sex'])}><option value="NOT_DECLARED">No declarado</option><option value="FEMALE">Femenino</option><option value="MALE">Masculino</option><option value="INTERSEX">Intersexual</option><option value="UNKNOWN">Desconocido</option></select></label><label>Teléfono <span className="optional-label">Opcional</span><input inputMode="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label><label>Correo electrónico <span className="optional-label">Opcional</span><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label><label className="form-span-two">Dirección <span className="optional-label">Opcional</span><input value={form.address} onChange={(event) => update('address', event.target.value)} /></label></div>{error && <p className="modal-error" role="alert">{error}</p>}<div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={!canSave || saving || checkingDuplicates}>{checkingDuplicates ? 'Buscando coincidencias...' : saving ? 'Guardando...' : 'Revisar y registrar'}</button></div></> : <><div className="duplicate-review" role="alert"><header><AlertTriangle aria-hidden="true" /><div><strong>Encontramos {duplicates.length} {duplicates.length === 1 ? 'posible coincidencia' : 'posibles coincidencias'}</strong><span>Compara los datos antes de crear otra ficha.</span></div></header><div className="duplicate-list">{duplicates.map((patient) => <div key={patient.id}><span className="avatar avatar-amber">{initials(patient.fullName)}</span><span><strong>{patient.fullName}</strong><small>{patient.patientCode} · {patient.documentNumber || 'Sin documento'} · Nac. {formatShortDate(patient.birthDate)}</small></span></div>)}</div><p>Registrar de todas formas puede crear una ficha duplicada. La API volverá a validar las restricciones antes de guardar.</p></div>{error && <p className="modal-error" role="alert">{error}</p>}<div className="modal-footer duplicate-footer"><button type="button" className="button button-secondary" disabled={saving} onClick={() => setDuplicates([])}>Corregir datos</button><button type="button" className="button button-danger" disabled={saving} onClick={() => void registerDespiteMatches()}>{saving ? 'Registrando...' : 'Registrar de todas formas'}</button></div></>}</form></div>
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return <tr><td colSpan={colSpan}><div className="empty-state"><strong>Cargando datos...</strong></div></td></tr>
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return <tr><td colSpan={colSpan}><div className="empty-state"><strong>{text}</strong></div></td></tr>
}

function fulfilledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null
}

function asArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : []
}

function isOperationalModule(view: ViewKey): view is OperationalModule {
  return ['laboratorio', 'farmacia', 'inventario', 'facturacion', 'reportes', 'administracion'].includes(view)
}

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
}

function firstName(name: string) {
  const cleanName = name.replace(/^(Dra?\.|Lic\.)\s+/i, '')
  return cleanName.split(/\s+/)[0] || 'usuario'
}

function humanize(value: string | null | undefined) {
  if (!value) return 'Sin estado'
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusTone(status: string | null | undefined): Tone {
  if (status && ['COMPLETED', 'CLOSED', 'PAID', 'VALIDATED', 'SUCCESS'].includes(status)) return 'green'
  if (status && ['CANCELLED', 'FAILED', 'REJECTED', 'PENDING'].includes(status)) return 'amber'
  return 'blue'
}

function formatMetric(value: number | null | undefined) {
  return value === null || value === undefined ? '--' : value.toLocaleString('es-BO')
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Sin datos'
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 2 }).format(value)
}

function exportDashboardSummary(data: DashboardData, appointments: Appointment[], patientTotal: number) {
  const rows = [
    ['Indicador', 'Valor'],
    ['Pacientes activos', data.reports?.summary?.activePatients ?? patientTotal],
    ['Citas activas', data.reports?.summary?.activeAppointments ?? appointments.length],
    ['Consultas', data.reports?.summary?.consultations ?? 0],
    ['Órdenes de laboratorio', data.reports?.summary?.labOrders ?? 0],
    ['Facturas', data.reports?.summary?.invoices ?? 0],
    ['Unidades en inventario', data.reports?.summary?.inventoryUnits ?? 0],
    ['Stock bajo', data.inventory?.summary?.lowStockLines ?? 0],
    ['Monto pendiente', data.billing?.summary?.pendingAmount ?? 0],
  ]
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `siih-resumen-${toDateInput(new Date())}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function toPatientRow(patient: ApiPatient): Patient {
  const active = patient.status === 'ACTIVE'
  return { id: patient.id, code: patient.patientCode, name: patient.fullName, document: patient.documentNumber ?? 'Sin documento', age: patient.age, lastVisit: 'No registrada', service: 'Sin servicio asignado', status: active ? 'Activo' : patient.status === 'DECEASED' ? 'Fallecido' : 'Inactivo', tone: active ? 'blue' : patient.status === 'DECEASED' ? 'amber' : 'green' }
}

async function hydrateAppointments(rawAppointments: ApiAppointment[], patients: Patient[], specialties: Specialty[], professionals: Professional[]): Promise<Appointment[]> {
  const knownPatients = new Map(patients.map((patient) => [patient.id, patient.name]))
  const missingPatientIds = [...new Set(rawAppointments.map((appointment) => appointment.patientId).filter((id) => !knownPatients.has(id)))]
  const missingPatients = await Promise.all(missingPatientIds.map(async (id) => {
    try { return await api.getPatient(id) } catch { return null }
  }))
  missingPatients.forEach((patient) => { if (patient) knownPatients.set(patient.id, patient.fullName) })
  const specialtyNames = new Map(specialties.map((specialty) => [specialty.id, specialty.name]))
  const professionalNames = new Map(professionals.map((professional) => [professional.id, professional.displayName]))

  return rawAppointments.map((appointment) => {
    const patient = knownPatients.get(appointment.patientId) ?? 'Paciente no disponible'
    return { id: appointment.id, appointmentCode: appointment.appointmentCode, patientId: appointment.patientId, time: formatTime(appointment.startsAt), date: formatShortDate(appointment.startsAt), patient, initials: initials(patient), specialty: specialtyNames.get(appointment.specialtyId) ?? 'Especialidad no disponible', doctor: professionalNames.get(appointment.professionalId) ?? 'Profesional no disponible', status: appointmentStatusLabel(appointment.status), tone: appointmentTone(appointment.status), rawStatus: appointment.status }
  })
}

function appointmentStatusLabel(status: AppointmentStatus): UiStatus {
  if (status === 'ARRIVED' || status === 'IN_PROGRESS') return 'En espera'
  if (status === 'COMPLETED') return 'Atendida'
  if (status === 'CANCELLED') return 'Cancelada'
  if (status === 'RESCHEDULED') return 'Reprogramada'
  if (status === 'NO_SHOW') return 'No asistió'
  return 'Confirmada'
}

function appointmentTone(status: AppointmentStatus): Tone {
  if (status === 'ARRIVED' || status === 'IN_PROGRESS' || status === 'NO_SHOW' || status === 'RESCHEDULED') return 'amber'
  if (status === 'COMPLETED') return 'green'
  return 'blue'
}

function getErrorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Ocurrió un error al comunicarse con el backend.'
}

function formatDate(date: Date) {
  const value = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatShortDate(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value
  return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short' }).format(new Date(normalized))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function nextHalfHour() {
  const date = new Date()
  date.setMinutes(date.getMinutes() + (30 - (date.getMinutes() % 30)))
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function addMinutes(time: string, minutes: number) {
  const [hours, currentMinutes] = time.split(':').map(Number)
  const total = hours * 60 + currentMinutes + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function toIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

function dayFilters(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { from: start.toISOString(), to: end.toISOString() }
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function isToday(date: Date) {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
}

function formatShortDay(date: Date) {
  return new Intl.DateTimeFormat('es-BO', { weekday: 'short' }).format(date)
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
}

function emptyHistoryFields(): HistoryFields {
  return { background: '', allergies: '', familyHistory: '', surgicalHistory: '', relevantNotes: '' }
}

function patientUpdateDefaults(patient: ApiPatient): PatientUpdateRequest {
  const nameParts = patient.fullName.trim().split(/\s+/)
  const firstName = nameParts.shift() ?? ''
  const lastName = nameParts.pop() ?? firstName
  return { firstName, middleName: nameParts.join(' '), lastName, secondLastName: '', birthDate: patient.birthDate, sex: patient.sex, phone: patient.phone ?? '', email: patient.email ?? '', address: patient.address ?? '', emergencyContactName: patient.emergencyContactName ?? '', emergencyContactPhone: patient.emergencyContactPhone ?? '', bloodType: patient.bloodType ?? '', status: patient.status }
}

export default Workspace
