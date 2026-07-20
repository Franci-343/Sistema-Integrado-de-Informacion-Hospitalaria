import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { api, type Appointment as ApiAppointment, type AppointmentStatus, type ClinicalHistory, type Consultation, type Patient as ApiPatient, type PatientCreateRequest, type PatientUpdateRequest, type Professional, type Specialty } from './api'
import './App.css'

type ViewKey =
  | 'inicio'
  | 'pacientes'
  | 'agenda'
  | 'historia'
  | 'laboratorio'
  | 'farmacia'
  | 'inventario'
  | 'facturacion'
  | 'reportes'
  | 'administracion'

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

const navigation: { label: string; key: ViewKey; icon: string }[] = [
  { label: 'Inicio', key: 'inicio', icon: '⌂' },
  { label: 'Pacientes', key: 'pacientes', icon: '♧' },
  { label: 'Agenda y citas', key: 'agenda', icon: '◷' },
  { label: 'Historia clínica', key: 'historia', icon: '▤' },
  { label: 'Laboratorio', key: 'laboratorio', icon: '⌁' },
  { label: 'Farmacia', key: 'farmacia', icon: '✣' },
  { label: 'Inventario', key: 'inventario', icon: '▥' },
  { label: 'Facturación', key: 'facturacion', icon: '▧' },
]

const managementNavigation: { label: string; key: ViewKey; icon: string }[] = [
  { label: 'Reportes', key: 'reportes', icon: '▦' },
  { label: 'Administración', key: 'administracion', icon: '⚙' },
]

const moduleInfo: Record<Exclude<ViewKey, 'inicio' | 'pacientes' | 'agenda'>, { title: string; description: string; action: string; icon: string }> = {
  historia: { title: 'Historia clínica', description: 'Consultas, antecedentes y evolución clínica autorizada.', action: 'Abrir historia', icon: '▤' },
  laboratorio: { title: 'Laboratorio', description: 'Órdenes, muestras y resultados pendientes de validación.', action: 'Nueva orden', icon: '⌁' },
  farmacia: { title: 'Farmacia', description: 'Recetas vigentes y dispensaciones del día.', action: 'Dispensar receta', icon: '✣' },
  inventario: { title: 'Inventario', description: 'Existencias, lotes y alertas de abastecimiento.', action: 'Registrar movimiento', icon: '▥' },
  facturacion: { title: 'Facturación', description: 'Servicios registrados, pagos y comprobantes.', action: 'Nueva factura', icon: '▧' },
  reportes: { title: 'Reportes', description: 'Indicadores operativos para seguimiento institucional.', action: 'Generar reporte', icon: '▦' },
  administracion: { title: 'Administración', description: 'Usuarios, roles y trazabilidad de operaciones sensibles.', action: 'Gestionar usuarios', icon: '⚙' },
}

function Icon({ symbol }: { symbol: string }) {
  return <span className="icon" aria-hidden="true">{symbol}</span>
}

function App() {
  const [activeView, setActiveView] = useState<ViewKey>('inicio')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientTotal, setPatientTotal] = useState(0)
  const [patientPages, setPatientPages] = useState(0)
  const [patientPage, setPatientPage] = useState(0)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('Esta semana')
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
  const [backendStatus, setBackendStatus] = useState<'loading' | 'online' | 'offline'>('loading')

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }, [])

  const loadPatients = useCallback(async (term: string, page: number) => {
    setLoadingPatients(true)
    try {
      const response = await api.getPatients(term, page, 20)
      setPatients(response.content.map(toPatientRow))
      setPatientTotal(response.totalElements)
      setPatientPages(response.totalPages)
      setHistoryPatientId((current) => current || response.content[0]?.id || '')
      setBackendStatus('online')
      setError('')
    } catch (reason) {
      setBackendStatus('offline')
      setError(getErrorMessage(reason))
    } finally {
      setLoadingPatients(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPatients(search, patientPage), 250)
    return () => window.clearTimeout(timer)
  }, [loadPatients, patientPage, search])

  useEffect(() => {
    let mounted = true

    const loadReferences = async () => {
      try {
        const [specialtyResponse, professionalResponse] = await Promise.all([
          api.getSpecialties(),
          api.getProfessionals(),
        ])
        if (mounted) {
          setSpecialties(specialtyResponse)
          setProfessionals(professionalResponse)
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
  }, [])

  const agendaFilters = useMemo(() => dayFilters(agendaDate), [agendaDate])

  const loadAppointments = useCallback(async (filters: { from?: string; to?: string } = {}) => {
    setLoadingAppointments(true)
    try {
      const response = await api.getAppointments(0, 50, filters)
      const hydrated = await hydrateAppointments(response.content, patients, specialties, professionals)
      setAppointments(hydrated)
      setBackendStatus('online')
      setError('')
    } catch (reason) {
      setBackendStatus('offline')
      setError(getErrorMessage(reason))
    } finally {
      setLoadingAppointments(false)
    }
  }, [patients, professionals, specialties])

  useEffect(() => {
    void loadAppointments(agendaFilters)
  }, [agendaFilters, loadAppointments])

  const markArrival = async (id: string) => {
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
    try {
      const duplicates = await api.findPatientDuplicates({
        documentNumber: payload.documentNumber,
        firstName: payload.firstName,
        lastName: payload.lastName,
        birthDate: payload.birthDate,
      })
      if (duplicates.length > 0 && !window.confirm(`Se encontraron ${duplicates.length} posibles duplicados. ¿Deseas registrar el paciente de todas formas?`)) {
        return
      }
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
    try {
      setPatientBeingEdited(await api.getPatient(id))
      setShowPatientEditModal(true)
    } catch (reason) {
      notify(getErrorMessage(reason))
    }
  }

  const updatePatient = async (id: string, payload: PatientUpdateRequest) => {
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
          <div className="brand-mark">S</div>
          <div><strong>SIIH</strong><span>Hospital San Andrés</span></div>
        </div>

        <div className="workspace-label">Módulos</div>
        <nav className="main-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <button className={`nav-item ${activeView === item.key ? 'active' : ''}`} key={item.key} type="button" onClick={() => setActiveView(item.key)}>
              <Icon symbol={item.icon} /><span>{item.label}</span>{item.key === 'pacientes' && patientTotal > 0 && <span className="nav-count">{patientTotal > 99 ? '99+' : patientTotal}</span>}
            </button>
          ))}
        </nav>

        <div className="workspace-label management-label">Gestión</div>
        <nav className="main-nav" aria-label="Navegación de gestión">
          {managementNavigation.map((item) => (
            <button className={`nav-item ${activeView === item.key ? 'active' : ''}`} key={item.key} type="button" onClick={() => setActiveView(item.key)}>
              <Icon symbol={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="support-card"><span className="support-icon">?</span><div><strong>¿Necesitas ayuda?</strong><span>Contactar a soporte TI</span></div><span className="arrow">↗</span></div>
          <div className={`system-status ${backendStatus === 'offline' ? 'system-status-offline' : ''}`}><span></span>{backendStatus === 'loading' ? 'Conectando con el backend...' : backendStatus === 'online' ? 'Backend conectado' : 'Backend no disponible'}</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>SIIH</span><span>/</span><strong>{currentTitle}</strong></div>
          <div className="topbar-actions">
            <div className="topbar-date"><span className="date-dot"></span>{todayLabel}</div>
            <button className="icon-button notification-button" type="button" aria-label="Ver notificaciones" onClick={() => notify('No tienes notificaciones nuevas')}><Icon symbol="♢" /><span className="notification-dot"></span></button>
            <div className="user-menu"><div className="avatar avatar-navy">AS</div><div className="user-copy"><strong>Andrea Suárez</strong><span>Admisión y recepción</span></div><span className="chevron">⌄</span></div>
          </div>
        </header>

        <div className="content-wrap">
          {error && <div className="connection-banner" role="alert"><strong>Backend:</strong> {error}<button type="button" onClick={() => { void loadPatients(search, patientPage); void loadAppointments(agendaFilters) }}>Reintentar</button></div>}
          {activeView === 'inicio' && <Dashboard appointments={appointments} patientTotal={patientTotal} waitingAppointments={waitingAppointments} completedAppointments={completedAppointments} period={period} loading={loadingAppointments} onPeriodChange={setPeriod} onMarkArrival={markArrival} onNewAppointment={() => setShowAppointmentModal(true)} onNotify={notify} onGoTo={setActiveView} />}
          {activeView === 'pacientes' && <PatientsView patients={patients} search={search} page={patientPage} totalPages={patientPages} totalElements={patientTotal} loading={loadingPatients} onSearchChange={(value) => { setSearch(value); setPatientPage(0) }} onPageChange={setPatientPage} onNewPatient={() => setShowPatientModal(true)} onEditPatient={editPatient} onNotify={notify} />}
          {activeView === 'agenda' && <AgendaView appointments={appointments} selectedDate={agendaDate} loading={loadingAppointments} onDateChange={(offset) => setAgendaDate((current) => addDays(current, offset))} onMarkArrival={markArrival} onCancel={async (id, reason) => { try { await api.cancelAppointment(id, reason); notify('Cita cancelada correctamente'); await loadAppointments(agendaFilters) } catch (failure) { notify(getErrorMessage(failure)) } }} onNewAppointment={() => setShowAppointmentModal(true)} onNotify={notify} />}
          {activeView === 'historia' && <ClinicalHistoryView patients={patients} professionals={professionals} appointments={appointments} selectedPatientId={historyPatientId} onPatientChange={setHistoryPatientId} onNotify={notify} />}
          {activeView !== 'inicio' && activeView !== 'pacientes' && activeView !== 'agenda' && activeView !== 'historia' && <GenericModuleView module={moduleInfo[activeView]} onAction={() => notify('Este módulo todavía no tiene endpoints implementados')} />}
        </div>
      </main>

      {showAppointmentModal && <AppointmentModal patients={patients} specialties={specialties} professionals={professionals} onClose={() => setShowAppointmentModal(false)} onSave={createAppointment} />}
      {showPatientModal && <PatientModal onClose={() => setShowPatientModal(false)} onSave={createPatient} />}
      {showPatientEditModal && patientBeingEdited && <PatientEditModal patient={patientBeingEdited} onClose={() => { setShowPatientEditModal(false); setPatientBeingEdited(null) }} onSave={updatePatient} />}
      {toast && <div className="toast" role="status"><span className="toast-check">✓</span>{toast}</div>}
    </div>
  )
}

function Dashboard({ appointments, patientTotal, waitingAppointments, completedAppointments, period, loading, onPeriodChange, onMarkArrival, onNewAppointment, onNotify, onGoTo }: { appointments: Appointment[]; patientTotal: number; waitingAppointments: number; completedAppointments: number; period: string; loading: boolean; onPeriodChange: (value: string) => void; onMarkArrival: (id: string) => Promise<void>; onNewAppointment: () => void; onNotify: (message: string) => void; onGoTo: (view: ViewKey) => void }) {
  return <>
    <section className="page-heading"><div><span className="eyebrow">Panel de control</span><h1>Buenos días, Andrea</h1><p>Estado operativo sincronizado con PostgreSQL.</p></div><div className="heading-actions"><button className="button button-secondary" type="button" onClick={() => onNotify('La exportación estará disponible con el módulo de reportes')}><Icon symbol="⇩" /> Exportar resumen</button><button className="button button-primary" type="button" onClick={onNewAppointment}><Icon symbol="+" /> Nueva cita</button></div></section>
    <section className="metric-grid" aria-label="Indicadores del sistema"><MetricCard label="Pacientes registrados" value={patientTotal.toLocaleString('es-BO')} change="PostgreSQL" detail="registro activo" icon="♧" tone="blue" /><MetricCard label="Citas cargadas" value={appointments.length.toString()} change="API" detail="agenda disponible" icon="◷" tone="teal" /><MetricCard label="En espera" value={waitingAppointments.toString().padStart(2, '0')} change="En vivo" detail="llegadas registradas" icon="◌" tone="amber" /><MetricCard label="Atenciones completadas" value={completedAppointments.toString()} change="API" detail="estado completado" icon="▧" tone="green" /></section>
    <section className="content-grid dashboard-grid"><div className="panel appointments-panel"><PanelHeader title="Agenda sincronizada" meta={`${appointments.length} citas devueltas por el backend`} action="Ver agenda completa" onAction={() => onGoTo('agenda')} /><div className="table-wrap"><table><thead><tr><th>Hora</th><th>Paciente</th><th>Especialidad</th><th>Profesional</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{loading ? <LoadingRow colSpan={6} /> : appointments.length === 0 ? <EmptyRow colSpan={6} text="No hay citas registradas en el backend." /> : appointments.slice(0, 5).map((appointment) => <AppointmentTableRow key={appointment.id} appointment={appointment} onMarkArrival={onMarkArrival} />)}</tbody></table></div><div className="panel-footer"><span>Datos actualizados desde la API</span><button type="button" className="text-button" onClick={() => onGoTo('agenda')}>Ver todas las citas <span>→</span></button></div></div><div className="panel activity-panel"><PanelHeader title="Citas sincronizadas" meta="Origen: backend" /><div className="activity-list">{appointments.slice(0, 4).map((appointment) => <Activity key={appointment.id} icon="✓" tone={appointment.tone} title={appointment.status} description={`${appointment.patient} · ${appointment.appointmentCode}`} time={appointment.date} />)}{!loading && appointments.length === 0 && <div className="empty-inline">No hay actividad de citas para mostrar.</div>}</div><div className="panel-footer"><button type="button" className="text-button" onClick={() => onGoTo('agenda')}>Abrir agenda <span>→</span></button></div></div></section>
    <section className="content-grid lower-grid"><div className="panel chart-panel"><PanelHeader title="Atenciones por servicio" meta="Vista preparada para reportes"><select className="select-control" value={period} onChange={(event) => onPeriodChange(event.target.value)} aria-label="Periodo del gráfico"><option>Esta semana</option><option>Este mes</option><option>Últimos 30 días</option></select></PanelHeader><div className="chart-area"><div className="chart-axis"><span>50</span><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div><div className="chart-bars">{[['Lun', 62, 44], ['Mar', 78, 55], ['Mié', 88, 67], ['Jue', 70, 50], ['Vie', 92, 72], ['Sáb', 48, 31]].map(([day, first, second]) => <div className="bar-group" key={day as string}><div className="bars"><span className="bar bar-primary" style={{ height: `${first}%` }}></span><span className="bar bar-secondary" style={{ height: `${second}%` }}></span></div><span>{day}</span></div>)}</div></div><div className="chart-legend"><span><i className="legend-dot dot-primary"></i>Consultas</span><span><i className="legend-dot dot-secondary"></i>Procedimientos</span></div></div><div className="panel alerts-panel"><PanelHeader title="Estado de integración" meta="Servicios conectados" /><div className="alert-list"><Alert tone="neutral" title="Pacientes" description="Listado, búsqueda y registro conectados." action="Abrir pacientes" onAction={() => onGoTo('pacientes')} /><Alert tone="neutral" title="Agenda" description="Citas, llegada y referencias conectadas." action="Abrir agenda" onAction={() => onGoTo('agenda')} /><Alert tone="warning" title="Módulos pendientes" description="Laboratorio, farmacia y facturación aún esperan backend." action="Ver módulos" onAction={() => onNotify('Los módulos restantes se conectarán en la siguiente etapa')} /></div></div></section>
  </>
}

function MetricCard({ label, value, change, detail, icon, tone }: { label: string; value: string; change: string; detail: string; icon: string; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon metric-${tone}`}><Icon symbol={icon} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small><b className={tone === 'amber' ? 'negative' : ''}>{change}</b> {detail}</small></div><span className="metric-arrow">↗</span></article>
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
  return <div className="alert-item"><div className={`alert-icon alert-${tone}`}>{tone === 'critical' ? '!' : tone === 'warning' ? '◒' : 'i'}</div><div className="alert-copy"><strong>{title}</strong><span>{description}</span><button type="button" className="text-button" onClick={onAction}>{action} <span>→</span></button></div></div>
}

function AppointmentTableRow({ appointment, onMarkArrival }: { appointment: Appointment; onMarkArrival: (id: string) => Promise<void> }) {
  return <tr><td className="time-cell">{appointment.time}</td><td><div className="person-cell"><div className={`avatar avatar-${appointment.tone}`}>{appointment.initials}</div><div><strong>{appointment.patient}</strong><span>{appointment.appointmentCode}</span></div></div></td><td>{appointment.specialty}</td><td>{appointment.doctor}</td><td><StatusPill tone={appointment.tone} label={appointment.status} /></td><td><button className="row-action" type="button" aria-label={`Registrar llegada de ${appointment.patient}`} onClick={() => void onMarkArrival(appointment.id)} disabled={appointment.rawStatus === 'COMPLETED' || appointment.rawStatus === 'CANCELLED'}>•••</button></td></tr>
}

function PatientsView({ patients, search, page, totalPages, totalElements, loading, onSearchChange, onPageChange, onNewPatient, onEditPatient, onNotify }: { patients: Patient[]; search: string; page: number; totalPages: number; totalElements: number; loading: boolean; onSearchChange: (value: string) => void; onPageChange: (page: number) => void; onNewPatient: () => void; onEditPatient: (id: string) => Promise<void>; onNotify: (message: string) => void }) {
  return <><section className="page-heading compact-heading"><div><span className="eyebrow">Admisión y registro</span><h1>Pacientes</h1><p>Consulta y actualiza la ficha única de pacientes.</p></div><button className="button button-primary" type="button" onClick={onNewPatient}><Icon symbol="+" /> Registrar paciente</button></section><section className="panel directory-panel"><div className="directory-toolbar"><div className="search-field large-search"><Icon symbol="⌕" /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por nombre, documento o código" aria-label="Buscar pacientes" />{search && <button type="button" aria-label="Limpiar búsqueda" onClick={() => onSearchChange('')}>×</button>}</div><button type="button" className="button button-secondary" onClick={() => onNotify('Los filtros avanzados estarán disponibles con el módulo de búsqueda')}><Icon symbol="≡" /> Filtros</button></div><div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Documento</th><th>Edad</th><th>Última atención</th><th>Servicio</th><th>Estado</th><th></th></tr></thead><tbody>{loading ? <LoadingRow colSpan={7} /> : patients.length === 0 ? <EmptyRow colSpan={7} text="No encontramos pacientes en el backend." /> : patients.map((patient) => <tr key={patient.id}><td><div className="person-cell"><div className="avatar avatar-soft">{patient.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><strong>{patient.name}</strong><span>{patient.code}</span></div></div></td><td>{patient.document}</td><td>{patient.age} años</td><td>{patient.lastVisit}</td><td>{patient.service}</td><td><StatusPill tone={patient.tone} label={patient.status} /></td><td><button className="row-action" type="button" aria-label={`Editar ficha de ${patient.name}`} onClick={() => void onEditPatient(patient.id)}>•••</button></td></tr>)}</tbody></table></div><div className="panel-footer"><span>Mostrando {patients.length} de {totalElements} pacientes</span><div className="pagination"><button type="button" aria-label="Página anterior" disabled={page === 0 || loading} onClick={() => onPageChange(page - 1)}>←</button><span>{totalPages === 0 ? '0 / 0' : `${page + 1} / ${totalPages}`}</span><button type="button" aria-label="Página siguiente" disabled={loading || totalPages === 0 || page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>→</button></div></div></section></>
}

function AgendaView({ appointments, selectedDate, loading, onDateChange, onMarkArrival, onCancel, onNewAppointment, onNotify }: { appointments: Appointment[]; selectedDate: Date; loading: boolean; onDateChange: (offset: number) => void; onMarkArrival: (id: string) => Promise<void>; onCancel: (id: string, reason: string) => Promise<void>; onNewAppointment: () => void; onNotify: (message: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const visibleAppointments = appointments.filter((appointment) => filter === 'all'
    || (filter === 'pending' && appointment.status !== 'Atendida' && appointment.status !== 'Cancelada')
    || (filter === 'completed' && appointment.status === 'Atendida'))
  const waiting = appointments.filter((appointment) => appointment.status === 'En espera').length

  return <><section className="page-heading compact-heading"><div><span className="eyebrow">Planificación de atención</span><h1>Agenda y citas</h1><p>{formatDate(selectedDate)} · Consulta externa</p></div><button className="button button-primary" type="button" onClick={onNewAppointment}><Icon symbol="+" /> Nueva cita</button></section><section className="agenda-summary"><div className="day-selector"><button type="button" aria-label="Día anterior" onClick={() => onDateChange(-1)}>←</button><strong>{isToday(selectedDate) ? 'Hoy' : formatShortDay(selectedDate)} <span>{selectedDate.getDate()}</span></strong><button type="button" aria-label="Día siguiente" onClick={() => onDateChange(1)}>→</button></div><div className="agenda-summary-stats"><span><b>{appointments.length}</b> citas</span><span><b>{waiting.toString().padStart(2, '0')}</b> en espera</span><span><b>--</b> espacios libres</span></div></section><section className="panel agenda-panel"><PanelHeader title="Citas cargadas" meta="Ordenadas por hora"><div className="segmented-control"><button className={filter === 'all' ? 'selected' : ''} type="button" onClick={() => setFilter('all')}>Todas</button><button className={filter === 'pending' ? 'selected' : ''} type="button" onClick={() => setFilter('pending')}>Pendientes</button><button className={filter === 'completed' ? 'selected' : ''} type="button" onClick={() => setFilter('completed')}>Atendidas</button></div></PanelHeader><div className="agenda-list">{loading ? <div className="empty-state"><strong>Cargando agenda...</strong></div> : visibleAppointments.length === 0 ? <div className="empty-state"><strong>No hay citas para mostrar</strong><span>Las citas creadas en el backend aparecerán aquí.</span></div> : visibleAppointments.map((appointment) => <div className="agenda-row" key={appointment.id}><div className="agenda-time">{appointment.time}<span>30 min</span></div><div className="agenda-line"></div><div className={`avatar avatar-${appointment.tone}`}>{appointment.initials}</div><div className="agenda-patient"><strong>{appointment.patient}</strong><span>{appointment.specialty} · {appointment.doctor}</span></div><StatusPill tone={appointment.tone} label={appointment.status} /><div className="agenda-actions"><button type="button" className="button button-small button-secondary" disabled={appointment.rawStatus === 'COMPLETED' || appointment.rawStatus === 'CANCELLED'} onClick={() => appointment.rawStatus === 'SCHEDULED' || appointment.rawStatus === 'CONFIRMED' ? void onMarkArrival(appointment.id) : onNotify(`Cita ${appointment.appointmentCode} seleccionada`)}>{appointment.rawStatus === 'SCHEDULED' || appointment.rawStatus === 'CONFIRMED' ? 'Registrar llegada' : 'Ver detalle'}</button>{['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'].includes(appointment.rawStatus) && <button type="button" className="button button-small button-danger" onClick={() => { const reason = window.prompt('Motivo de cancelación'); if (reason?.trim()) void onCancel(appointment.id, reason.trim()) }}>Cancelar</button>}</div></div>)}</div></section></>
}

type HistoryFields = Pick<ClinicalHistory, 'background' | 'allergies' | 'familyHistory' | 'surgicalHistory' | 'relevantNotes'>

function ClinicalHistoryView({ patients, professionals, appointments, selectedPatientId, onPatientChange, onNotify }: { patients: Patient[]; professionals: Professional[]; appointments: Appointment[]; selectedPatientId: string; onPatientChange: (id: string) => void; onNotify: (message: string) => void }) {
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
      if (consultationResult.status === 'fulfilled') setConsultations(consultationResult.value)
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
    if (!selectedPatientId) return
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
    if (!selectedPatientId || !professionalId || !chiefComplaint.trim()) return
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

  return <><section className="page-heading compact-heading"><div><span className="eyebrow">Atención clínica</span><h1>Historia clínica</h1><p>Antecedentes y consultas obtenidos desde el backend.</p></div><label className="patient-selector">Paciente<select value={selectedPatientId} onChange={(event) => onPatientChange(event.target.value)}>{patients.map((patient) => <option value={patient.id} key={patient.id}>{patient.name} · {patient.code}</option>)}</select></label></section>{!selectedPatient ? <section className="module-empty panel"><h2>No hay pacientes para consultar</h2><p>Registra un paciente para habilitar su historia clínica.</p></section> : <><div className="history-patient-summary"><div className="avatar avatar-soft">{selectedPatient.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><strong>{selectedPatient.name}</strong><span>{selectedPatient.code} · {selectedPatient.document} · {selectedPatient.age} años</span></div><StatusPill tone={selectedPatient.tone} label={selectedPatient.status} /></div>{viewError && <div className="connection-banner" role="alert">{viewError}</div>}<section className="clinical-grid"><form className="panel clinical-history-panel" onSubmit={(event) => void saveHistory(event)}><PanelHeader title="Antecedentes" meta={history ? `Actualizada ${formatShortDateTime(history.updatedAt)}` : 'Sin registro previo'} /><div className="clinical-form"><label>Antecedentes<textarea value={historyFields.background ?? ''} onChange={(event) => setHistoryFields((current) => ({ ...current, background: event.target.value }))} /></label><label>Alergias<textarea value={historyFields.allergies ?? ''} onChange={(event) => setHistoryFields((current) => ({ ...current, allergies: event.target.value }))} /></label><label>Antecedentes familiares<textarea value={historyFields.familyHistory ?? ''} onChange={(event) => setHistoryFields((current) => ({ ...current, familyHistory: event.target.value }))} /></label><label>Antecedentes quirúrgicos<textarea value={historyFields.surgicalHistory ?? ''} onChange={(event) => setHistoryFields((current) => ({ ...current, surgicalHistory: event.target.value }))} /></label><label>Notas relevantes<textarea value={historyFields.relevantNotes ?? ''} onChange={(event) => setHistoryFields((current) => ({ ...current, relevantNotes: event.target.value }))} /></label></div><div className="panel-footer"><span>{loading ? 'Cargando...' : 'Campos guardados en clinical_history'}</span><button type="submit" className="button button-primary" disabled={savingHistory}>{savingHistory ? 'Guardando...' : 'Guardar historia'}</button></div></form><section className="panel consultations-panel"><PanelHeader title="Consultas" meta={`${consultations.length} registros`}><button type="button" className="button button-secondary" disabled={!professionals.length} onClick={() => setShowConsultationForm((current) => !current)}><Icon symbol="+" /> Nueva consulta</button></PanelHeader>{showConsultationForm && <form className="consultation-form" onSubmit={(event) => void createConsultation(event)}><label>Profesional<select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>{professionals.map((professional) => <option value={professional.id} key={professional.id}>{professional.displayName}</option>)}</select></label><label>Cita relacionada<select value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)}><option value="">Sin cita</option>{patientAppointments.map((appointment) => <option value={appointment.id} key={appointment.id}>{appointment.appointmentCode} · {appointment.time}</option>)}</select></label><label className="form-span-two">Motivo de consulta<input required value={chiefComplaint} onChange={(event) => setChiefComplaint(event.target.value)} /></label><label className="form-span-two">Evolución<textarea value={evolution} onChange={(event) => setEvolution(event.target.value)} /></label><label className="form-span-two">Recomendaciones<textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} /></label><div className="form-actions form-span-two"><button type="submit" className="button button-primary" disabled={creatingConsultation}>{creatingConsultation ? 'Iniciando...' : 'Iniciar consulta'}</button></div></form>}{!loading && consultations.length === 0 ? <div className="empty-state"><strong>No hay consultas registradas</strong><span>Las consultas creadas aparecerán aquí.</span></div> : <div className="consultation-list">{consultations.map((consultation) => <article className="consultation-item" key={consultation.id}><div><button type="button" className="consultation-link" onClick={() => void openConsultationDetail(consultation.id)}>{consultation.consultationCode}</button><span>{formatShortDateTime(consultation.createdAt)} · {consultation.chiefComplaint}</span></div><StatusPill tone={consultation.status === 'CLOSED' ? 'green' : 'amber'} label={consultation.status === 'CLOSED' ? 'Cerrada' : consultation.status === 'DRAFT' ? 'Borrador' : consultation.status} />{consultation.status === 'DRAFT' && <button type="button" className="button button-small button-secondary" onClick={() => setConsultationToClose(consultation)}>Cerrar consulta</button>}</article>)}</div>}{consultationDetail && <div className="consultation-detail"><div><strong>Detalle {consultationDetail.consultationCode}</strong><button type="button" className="close-button" aria-label="Cerrar detalle" onClick={() => setConsultationDetail(null)}>×</button></div><p><b>Motivo:</b> {consultationDetail.chiefComplaint}</p><p><b>Evolución:</b> {consultationDetail.evolution || 'Sin registrar'}</p><p><b>Diagnóstico:</b> {consultationDetail.diagnosisSummary || 'Pendiente de cierre'}</p><p><b>Tratamiento:</b> {consultationDetail.treatmentPlan || 'Pendiente de cierre'}</p></div>}</section></section></>}{consultationToClose && <ConsultationCloseModal consultation={consultationToClose} onClose={() => setConsultationToClose(null)} onSave={closeConsultation} />}</>
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
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-patient-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="modal-header"><div><span className="eyebrow">Ficha {patient.patientCode}</span><h2 id="edit-patient-title">Editar paciente</h2></div><button type="button" className="close-button" aria-label="Cerrar" onClick={onClose}>×</button></div><div className="form-grid"><label>Primer nombre<input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} /></label><label>Apellido<input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} /></label><label>Fecha de nacimiento<input required type="date" value={form.birthDate} onChange={(event) => update('birthDate', event.target.value)} /></label><label>Sexo<select value={form.sex} onChange={(event) => update('sex', event.target.value as PatientUpdateRequest['sex'])}><option value="NOT_DECLARED">No declarado</option><option value="FEMALE">Femenino</option><option value="MALE">Masculino</option><option value="INTERSEX">Intersexual</option><option value="UNKNOWN">Desconocido</option></select></label><label>Estado<select value={form.status} onChange={(event) => update('status', event.target.value as PatientUpdateRequest['status'])}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="DECEASED">Fallecido</option></select></label><label>Teléfono<input value={form.phone ?? ''} onChange={(event) => update('phone', event.target.value)} /></label><label>Correo electrónico<input type="email" value={form.email ?? ''} onChange={(event) => update('email', event.target.value)} /></label><label>Dirección<input value={form.address ?? ''} onChange={(event) => update('address', event.target.value)} /></label></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></div></form></div>
}

function ConsultationCloseModal({ consultation, onClose, onSave }: { consultation: Consultation; onClose: () => void; onSave: (id: string, payload: { chiefComplaint: string; evolution?: string; diagnosisSummary: string; treatmentPlan: string; recommendations?: string }) => Promise<void> }) {
  const [form, setForm] = useState({ chiefComplaint: consultation.chiefComplaint, evolution: consultation.evolution ?? '', diagnosisSummary: '', treatmentPlan: '', recommendations: consultation.recommendations ?? '' })
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { await onSave(consultation.id, form) } finally { setSaving(false) } }
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="close-consultation-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="modal-header"><div><span className="eyebrow">{consultation.consultationCode}</span><h2 id="close-consultation-title">Cerrar consulta</h2></div><button type="button" className="close-button" aria-label="Cerrar" onClick={onClose}>×</button></div><div className="form-grid"><label className="form-span-two">Motivo de consulta<input required value={form.chiefComplaint} onChange={(event) => setForm((current) => ({ ...current, chiefComplaint: event.target.value }))} /></label><label className="form-span-two">Evolución<textarea value={form.evolution} onChange={(event) => setForm((current) => ({ ...current, evolution: event.target.value }))} /></label><label className="form-span-two">Diagnóstico<input required value={form.diagnosisSummary} onChange={(event) => setForm((current) => ({ ...current, diagnosisSummary: event.target.value }))} /></label><label className="form-span-two">Plan de tratamiento<textarea required value={form.treatmentPlan} onChange={(event) => setForm((current) => ({ ...current, treatmentPlan: event.target.value }))} /></label><label className="form-span-two">Recomendaciones<textarea value={form.recommendations} onChange={(event) => setForm((current) => ({ ...current, recommendations: event.target.value }))} /></label></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Cerrando...' : 'Cerrar consulta'}</button></div></form></div>
}

function GenericModuleView({ module, onAction }: { module: { title: string; description: string; action: string; icon: string }; onAction: () => void }) {
  return <><section className="page-heading compact-heading"><div><span className="eyebrow">Módulo operativo</span><h1>{module.title}</h1><p>{module.description}</p></div><button type="button" className="button button-primary" onClick={onAction}><Icon symbol="+" /> {module.action}</button></section><section className="module-empty panel"><div className="module-empty-icon"><Icon symbol={module.icon} /></div><span className="eyebrow">Integración pendiente</span><h2>El módulo está preparado</h2><p>Esta vista queda reservada para los endpoints de {module.title.toLowerCase()}.</p><button type="button" className="button button-secondary" onClick={onAction}>Ver estado</button></section></>
}

type AppointmentForm = { patientId: string; specialtyId: string; professionalId: string; date: string; time: string; reason: string }

function AppointmentModal({ patients, specialties, professionals, onClose, onSave }: { patients: Patient[]; specialties: Specialty[]; professionals: Professional[]; onClose: () => void; onSave: (payload: AppointmentForm) => Promise<void> }) {
  const [form, setForm] = useState<AppointmentForm>({ patientId: patients[0]?.id ?? '', specialtyId: specialties[0]?.id ?? '', professionalId: professionals[0]?.id ?? '', date: toDateInput(new Date()), time: nextHalfHour(), reason: '' })
  const [saving, setSaving] = useState(false)
  const update = <K extends keyof AppointmentForm>(key: K, value: AppointmentForm[K]) => setForm((current) => ({ ...current, [key]: value }))
  const canSave = Boolean(form.patientId && form.specialtyId && form.professionalId && form.date && form.time)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="appointment-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="modal-header"><div><span className="eyebrow">Agenda</span><h2 id="appointment-title">Nueva cita</h2></div><button type="button" className="close-button" aria-label="Cerrar" onClick={onClose}>×</button></div><div className="form-grid"><label>Paciente<select value={form.patientId} onChange={(event) => update('patientId', event.target.value)}>{patients.map((patient) => <option value={patient.id} key={patient.id}>{patient.name} · {patient.code}</option>)}</select></label><label>Especialidad<select value={form.specialtyId} onChange={(event) => update('specialtyId', event.target.value)}>{specialties.map((specialty) => <option value={specialty.id} key={specialty.id}>{specialty.name}</option>)}</select></label><label>Profesional<select value={form.professionalId} onChange={(event) => update('professionalId', event.target.value)}>{professionals.map((professional) => <option value={professional.id} key={professional.id}>{professional.displayName}</option>)}</select></label><label>Fecha<input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></label><label>Hora<input type="time" value={form.time} onChange={(event) => update('time', event.target.value)} /></label><label>Motivo<input value={form.reason} onChange={(event) => update('reason', event.target.value)} placeholder="Consulta de seguimiento" /></label></div>{(!patients.length || !specialties.length || !professionals.length) && <p className="modal-error">Para crear una cita se necesita al menos un paciente, una especialidad y un profesional registrados.</p>}<div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={!canSave || saving}>{saving ? 'Guardando...' : 'Confirmar cita'}</button></div></form></div>
}

function PatientModal({ onClose, onSave }: { onClose: () => void; onSave: (payload: PatientCreateRequest) => Promise<void> }) {
  const [form, setForm] = useState<PatientCreateRequest>({ documentType: 'CI', firstName: '', lastName: '', birthDate: '', sex: 'NOT_DECLARED', documentNumber: '', phone: '', email: '', address: '' })
  const [saving, setSaving] = useState(false)
  const update = <K extends keyof PatientCreateRequest>(key: K, value: PatientCreateRequest[K]) => setForm((current) => ({ ...current, [key]: value }))
  const canSave = Boolean(form.firstName.trim() && form.lastName.trim() && form.birthDate)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    try { await onSave({ ...form, documentNumber: form.documentNumber || undefined, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined }) } finally { setSaving(false) }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="patient-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}><div className="modal-header"><div><span className="eyebrow">Admisión y registro</span><h2 id="patient-title">Registrar paciente</h2></div><button type="button" className="close-button" aria-label="Cerrar" onClick={onClose}>×</button></div><div className="form-grid"><label>Tipo de documento<select value={form.documentType} onChange={(event) => update('documentType', event.target.value as PatientCreateRequest['documentType'])}><option value="CI">Cédula de identidad</option><option value="PASSPORT">Pasaporte</option><option value="FOREIGN_ID">Documento extranjero</option><option value="NONE">Sin documento</option></select></label><label>Número de documento<input value={form.documentNumber} onChange={(event) => update('documentNumber', event.target.value)} /></label><label>Primer nombre<input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} /></label><label>Apellido paterno<input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} /></label><label>Fecha de nacimiento<input required type="date" value={form.birthDate} onChange={(event) => update('birthDate', event.target.value)} /></label><label>Sexo<select value={form.sex} onChange={(event) => update('sex', event.target.value as PatientCreateRequest['sex'])}><option value="NOT_DECLARED">No declarado</option><option value="FEMALE">Femenino</option><option value="MALE">Masculino</option><option value="INTERSEX">Intersexual</option><option value="UNKNOWN">Desconocido</option></select></label><label>Teléfono<input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label><label>Correo electrónico<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label><label className="form-span-two">Dirección<input value={form.address} onChange={(event) => update('address', event.target.value)} /></label></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={!canSave || saving}>{saving ? 'Guardando...' : 'Registrar paciente'}</button></div></form></div>
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return <tr><td colSpan={colSpan}><div className="empty-state"><strong>Cargando datos...</strong></div></td></tr>
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return <tr><td colSpan={colSpan}><div className="empty-state"><strong>{text}</strong></div></td></tr>
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
    return { id: appointment.id, appointmentCode: appointment.appointmentCode, patientId: appointment.patientId, time: formatTime(appointment.startsAt), date: formatShortDate(appointment.startsAt), patient, initials: patient.split(' ').map((part) => part[0]).slice(0, 2).join(''), specialty: specialtyNames.get(appointment.specialtyId) ?? 'Especialidad no disponible', doctor: professionalNames.get(appointment.professionalId) ?? 'Profesional no disponible', status: appointmentStatusLabel(appointment.status), tone: appointmentTone(appointment.status), rawStatus: appointment.status }
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
  return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short' }).format(new Date(value))
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

export default App
