import { useMemo, useState } from 'react'
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

type Appointment = {
  id: string
  time: string
  patient: string
  initials: string
  specialty: string
  doctor: string
  status: 'En espera' | 'Confirmada' | 'Atendida'
  tone: 'amber' | 'blue' | 'green'
}

type Patient = {
  id: string
  name: string
  document: string
  age: number
  lastVisit: string
  service: string
  status: 'En atención' | 'Programada' | 'Alta'
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

const initialAppointments: Appointment[] = [
  { id: 'CIT-1048', time: '08:30', patient: 'Valeria Quispe Mamani', initials: 'VQ', specialty: 'Medicina interna', doctor: 'Dra. Laura Vargas', status: 'En espera', tone: 'amber' },
  { id: 'CIT-1049', time: '09:00', patient: 'Marco Antonio Rojas', initials: 'MR', specialty: 'Cardiología', doctor: 'Dr. Andrés Salvatierra', status: 'Confirmada', tone: 'blue' },
  { id: 'CIT-1050', time: '09:30', patient: 'Lucía Fernández Paz', initials: 'LF', specialty: 'Pediatría', doctor: 'Dra. Natalia Cárdenas', status: 'Confirmada', tone: 'blue' },
  { id: 'CIT-1051', time: '10:00', patient: 'Diego Sebastián Flores', initials: 'DF', specialty: 'Traumatología', doctor: 'Dr. Carlos Mercado', status: 'Confirmada', tone: 'blue' },
  { id: 'CIT-1052', time: '10:30', patient: 'Rosa Elena Gutiérrez', initials: 'RG', specialty: 'Ginecología', doctor: 'Dra. Laura Vargas', status: 'Atendida', tone: 'green' },
]

const patients: Patient[] = [
  { id: 'PAC-00842', name: 'Valeria Quispe Mamani', document: '6812047 LP', age: 34, lastVisit: '16 jul 2026', service: 'Medicina interna', status: 'En atención' },
  { id: 'PAC-00841', name: 'Marco Antonio Rojas', document: '4921873 LP', age: 58, lastVisit: '14 jul 2026', service: 'Cardiología', status: 'Programada' },
  { id: 'PAC-00840', name: 'Lucía Fernández Paz', document: '7351049 LP', age: 9, lastVisit: '12 jul 2026', service: 'Pediatría', status: 'Programada' },
  { id: 'PAC-00839', name: 'Diego Sebastián Flores', document: '6182471 LP', age: 42, lastVisit: '10 jul 2026', service: 'Traumatología', status: 'Alta' },
  { id: 'PAC-00838', name: 'Rosa Elena Gutiérrez', document: '4039812 LP', age: 67, lastVisit: '16 jul 2026', service: 'Ginecología', status: 'Alta' },
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
  const [appointments, setAppointments] = useState(initialAppointments)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('Esta semana')
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [toast, setToast] = useState('')

  const filteredPatients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return patients
    return patients.filter((patient) =>
      `${patient.name} ${patient.document} ${patient.id}`.toLowerCase().includes(normalizedSearch),
    )
  }, [search])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const markArrival = (id: string) => {
    setAppointments((current) => current.map((appointment) =>
      appointment.id === id ? { ...appointment, status: 'En espera', tone: 'amber' } : appointment,
    ))
    notify('Llegada registrada correctamente')
  }

  const currentTitle = activeView === 'inicio' ? 'Resumen operativo' : navigation.concat(managementNavigation).find((item) => item.key === activeView)?.label ?? 'SIIH'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>SIIH</strong>
            <span>Hospital San Andrés</span>
          </div>
        </div>

        <div className="workspace-label">Módulos</div>
        <nav className="main-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <button
              className={`nav-item ${activeView === item.key ? 'active' : ''}`}
              key={item.key}
              type="button"
              onClick={() => setActiveView(item.key)}
            >
              <Icon symbol={item.icon} />
              <span>{item.label}</span>
              {item.key === 'pacientes' && <span className="nav-count">24</span>}
            </button>
          ))}
        </nav>

        <div className="workspace-label management-label">Gestión</div>
        <nav className="main-nav" aria-label="Navegación de gestión">
          {managementNavigation.map((item) => (
            <button
              className={`nav-item ${activeView === item.key ? 'active' : ''}`}
              key={item.key}
              type="button"
              onClick={() => setActiveView(item.key)}
            >
              <Icon symbol={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="support-card">
            <span className="support-icon">?</span>
            <div>
              <strong>¿Necesitas ayuda?</strong>
              <span>Contactar a soporte TI</span>
            </div>
            <span className="arrow">↗</span>
          </div>
          <div className="system-status"><span></span> Todos los servicios operativos</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>SIIH</span><span>/</span><strong>{currentTitle}</strong></div>
          <div className="topbar-actions">
            <div className="topbar-date"><span className="date-dot"></span> Miércoles, 16 de julio de 2026</div>
            <button className="icon-button notification-button" type="button" aria-label="Ver notificaciones" onClick={() => notify('No tienes notificaciones nuevas')}>
              <Icon symbol="♢" /><span className="notification-dot"></span>
            </button>
            <div className="user-menu">
              <div className="avatar avatar-navy">AS</div>
              <div className="user-copy"><strong>Andrea Suárez</strong><span>Admisión y recepción</span></div>
              <span className="chevron">⌄</span>
            </div>
          </div>
        </header>

        <div className="content-wrap">
          {activeView === 'inicio' && (
            <Dashboard
              appointments={appointments}
              period={period}
              onPeriodChange={setPeriod}
              onMarkArrival={markArrival}
              onNewAppointment={() => setShowAppointmentModal(true)}
              onNotify={notify}
              onGoTo={(view) => setActiveView(view)}
            />
          )}
          {activeView === 'pacientes' && <PatientsView patients={filteredPatients} search={search} onSearchChange={setSearch} onNewPatient={() => notify('Formulario de paciente disponible cuando conectemos el backend')} onNotify={notify} />}
          {activeView === 'agenda' && <AgendaView appointments={appointments} onMarkArrival={markArrival} onNewAppointment={() => setShowAppointmentModal(true)} onNotify={notify} />}
          {activeView !== 'inicio' && activeView !== 'pacientes' && activeView !== 'agenda' && <GenericModuleView module={moduleInfo[activeView]} onAction={() => notify(`${moduleInfo[activeView].action}: módulo preparado para integración`)} />}
        </div>
      </main>

      {showAppointmentModal && <AppointmentModal onClose={() => setShowAppointmentModal(false)} onSave={() => { setShowAppointmentModal(false); notify('Cita creada correctamente') }} />}
      {toast && <div className="toast" role="status"><span className="toast-check">✓</span>{toast}</div>}
    </div>
  )
}

function Dashboard({ appointments, period, onPeriodChange, onMarkArrival, onNewAppointment, onNotify, onGoTo }: { appointments: Appointment[]; period: string; onPeriodChange: (value: string) => void; onMarkArrival: (id: string) => void; onNewAppointment: () => void; onNotify: (message: string) => void; onGoTo: (view: ViewKey) => void }) {
  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">Panel de control</span>
          <h1>Buenos días, Andrea</h1>
          <p>Este es el estado operativo del hospital para hoy.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" type="button" onClick={() => onNotify('El reporte se generará cuando el backend esté conectado')}><Icon symbol="⇩" /> Exportar resumen</button>
          <button className="button button-primary" type="button" onClick={onNewAppointment}><Icon symbol="+" /> Nueva cita</button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Indicadores del día">
        <MetricCard label="Pacientes atendidos" value="128" change="+12.5%" detail="vs. ayer" icon="♧" tone="blue" />
        <MetricCard label="Citas programadas" value="42" change="8 pendientes" detail="para hoy" icon="◷" tone="teal" />
        <MetricCard label="En espera" value="07" change="-2" detail="vs. ayer" icon="◌" tone="amber" />
        <MetricCard label="Ingresos del día" value="Bs 18.420" change="+8.2%" detail="vs. ayer" icon="▧" tone="green" />
      </section>

      <section className="content-grid dashboard-grid">
        <div className="panel appointments-panel">
          <PanelHeader title="Agenda de hoy" meta="42 citas" action="Ver agenda completa" onAction={() => onGoTo('agenda')} />
          <div className="table-wrap">
            <table>
              <thead><tr><th>Hora</th><th>Paciente</th><th>Especialidad</th><th>Profesional</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>{appointments.slice(0, 5).map((appointment) => (
                <tr key={appointment.id}>
                  <td className="time-cell">{appointment.time}</td>
                  <td><div className="person-cell"><div className={`avatar avatar-${appointment.tone}`}>{appointment.initials}</div><div><strong>{appointment.patient}</strong><span>{appointment.id}</span></div></div></td>
                  <td>{appointment.specialty}</td>
                  <td>{appointment.doctor}</td>
                  <td><StatusPill tone={appointment.tone} label={appointment.status} /></td>
                  <td><button className="row-action" type="button" aria-label={`Abrir ${appointment.patient}`} onClick={() => onMarkArrival(appointment.id)}>•••</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="panel-footer"><span>Última actualización: hace 2 min</span><button type="button" className="text-button" onClick={() => onGoTo('agenda')}>Ver todas las citas <span>→</span></button></div>
        </div>

        <div className="panel activity-panel">
          <PanelHeader title="Actividad reciente" meta="En tiempo real" />
          <div className="activity-list">
            <Activity icon="✓" tone="green" title="Consulta cerrada" description="Dr. Carlos Mercado · PAC-00839" time="Hace 4 min" />
            <Activity icon="+" tone="blue" title="Paciente registrado" description="Recepción · PAC-00842" time="Hace 12 min" />
            <Activity icon="▣" tone="violet" title="Resultado validado" description="Laboratorio · LAB-00218" time="Hace 18 min" />
            <Activity icon="↗" tone="amber" title="Dispensación parcial" description="Farmacia · REC-00471" time="Hace 31 min" />
          </div>
          <div className="panel-footer"><button type="button" className="text-button" onClick={() => onGoTo('reportes')}>Ver auditoría <span>→</span></button></div>
        </div>
      </section>

      <section className="content-grid lower-grid">
        <div className="panel chart-panel">
          <PanelHeader title="Atenciones por servicio" meta="Distribución semanal">
            <select className="select-control" value={period} onChange={(event) => onPeriodChange(event.target.value)} aria-label="Periodo del gráfico"><option>Esta semana</option><option>Este mes</option><option>Últimos 30 días</option></select>
          </PanelHeader>
          <div className="chart-area">
            <div className="chart-axis"><span>50</span><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div>
            <div className="chart-bars">
              {[['Lun', 62, 44], ['Mar', 78, 55], ['Mié', 88, 67], ['Jue', 70, 50], ['Vie', 92, 72], ['Sáb', 48, 31]].map(([day, first, second]) => <div className="bar-group" key={day as string}><div className="bars"><span className="bar bar-primary" style={{ height: `${first}%` }}></span><span className="bar bar-secondary" style={{ height: `${second}%` }}></span></div><span>{day}</span></div>)}
            </div>
          </div>
          <div className="chart-legend"><span><i className="legend-dot dot-primary"></i>Consultas</span><span><i className="legend-dot dot-secondary"></i>Procedimientos</span></div>
        </div>

        <div className="panel alerts-panel">
          <PanelHeader title="Alertas operativas" meta="3 activas" />
          <div className="alert-list">
            <Alert tone="critical" title="Stock bajo" description="Amoxicilina 500 mg · quedan 8 unidades" action="Revisar inventario" onAction={() => onGoTo('inventario')} />
            <Alert tone="warning" title="Resultados pendientes" description="4 órdenes esperan validación" action="Ir a laboratorio" onAction={() => onGoTo('laboratorio')} />
            <Alert tone="neutral" title="Citas sin confirmar" description="6 pacientes aún no confirmaron" action="Ver agenda" onAction={() => onGoTo('agenda')} />
          </div>
        </div>
      </section>
    </>
  )
}

function MetricCard({ label, value, change, detail, icon, tone }: { label: string; value: string; change: string; detail: string; icon: string; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon metric-${tone}`}><Icon symbol={icon} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small><b className={tone === 'amber' ? 'negative' : ''}>{change}</b> {detail}</small></div><span className="metric-arrow">↗</span></article>
}

function PanelHeader({ title, meta, action, onAction, children }: { title: string; meta?: string; action?: string; onAction?: () => void; children?: React.ReactNode }) {
  return <div className="panel-header"><div><h2>{title}</h2>{meta && <span>{meta}</span>}</div>{children ?? (action && <button type="button" className="text-button" onClick={onAction}>{action} <span>→</span></button>)}</div>
}

function StatusPill({ tone, label }: { tone: string; label: string }) { return <span className={`status-pill status-${tone}`}><i></i>{label}</span> }

function Activity({ icon, tone, title, description, time }: { icon: string; tone: string; title: string; description: string; time: string }) {
  return <div className="activity-item"><div className={`activity-icon activity-${tone}`}>{icon}</div><div><strong>{title}</strong><span>{description}</span></div><time>{time}</time></div>
}

function Alert({ tone, title, description, action, onAction }: { tone: string; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="alert-item"><div className={`alert-icon alert-${tone}`}>{tone === 'critical' ? '!' : tone === 'warning' ? '◒' : 'i'}</div><div className="alert-copy"><strong>{title}</strong><span>{description}</span><button type="button" className="text-button" onClick={onAction}>{action} <span>→</span></button></div></div>
}

function PatientsView({ patients, search, onSearchChange, onNewPatient, onNotify }: { patients: Patient[]; search: string; onSearchChange: (value: string) => void; onNewPatient: () => void; onNotify: (message: string) => void }) {
  return <>
    <section className="page-heading compact-heading"><div><span className="eyebrow">Admisión y registro</span><h1>Pacientes</h1><p>Consulta y actualiza la ficha única de pacientes.</p></div><button className="button button-primary" type="button" onClick={onNewPatient}><Icon symbol="+" /> Registrar paciente</button></section>
    <section className="panel directory-panel"><div className="directory-toolbar"><div className="search-field large-search"><Icon symbol="⌕" /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por nombre, documento o código" aria-label="Buscar pacientes" />{search && <button type="button" aria-label="Limpiar búsqueda" onClick={() => onSearchChange('')}>×</button>}</div><button type="button" className="button button-secondary" onClick={() => onNotify('Filtros avanzados disponibles en la siguiente integración')}><Icon symbol="≡" /> Filtros</button></div><div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Documento</th><th>Edad</th><th>Última atención</th><th>Servicio</th><th>Estado</th><th></th></tr></thead><tbody>{patients.map((patient) => <tr key={patient.id}><td><div className="person-cell"><div className="avatar avatar-soft">{patient.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><strong>{patient.name}</strong><span>{patient.id}</span></div></div></td><td>{patient.document}</td><td>{patient.age} años</td><td>{patient.lastVisit}</td><td>{patient.service}</td><td><StatusPill tone={patient.status === 'En atención' ? 'amber' : patient.status === 'Alta' ? 'green' : 'blue'} label={patient.status} /></td><td><button className="row-action" type="button" aria-label={`Más opciones para ${patient.name}`} onClick={() => onNotify(`Ficha ${patient.id} seleccionada`)}>•••</button></td></tr>)}</tbody></table></div>{patients.length === 0 && <div className="empty-state"><strong>No encontramos pacientes</strong><span>Prueba con otro nombre, documento o código.</span></div>}<div className="panel-footer"><span>Mostrando {patients.length} de 842 pacientes</span><div className="pagination"><button type="button" disabled>←</button><span>1 / 85</span><button type="button" onClick={() => onNotify('Página siguiente disponible en la conexión con el backend')}>→</button></div></div></section>
  </>
}

function AgendaView({ appointments, onMarkArrival, onNewAppointment, onNotify }: { appointments: Appointment[]; onMarkArrival: (id: string) => void; onNewAppointment: () => void; onNotify: (message: string) => void }) {
  return <><section className="page-heading compact-heading"><div><span className="eyebrow">Planificación de atención</span><h1>Agenda y citas</h1><p>Miércoles, 16 de julio · Consulta externa</p></div><button className="button button-primary" type="button" onClick={onNewAppointment}><Icon symbol="+" /> Nueva cita</button></section><section className="agenda-summary"><div className="day-selector"><button type="button" onClick={() => onNotify('Día anterior disponible en la agenda conectada')}>←</button><strong>Mié <span>16</span></strong><button type="button" onClick={() => onNotify('Día siguiente disponible en la agenda conectada')}>→</button></div><div className="agenda-summary-stats"><span><b>42</b> citas</span><span><b>07</b> en espera</span><span><b>03</b> espacios libres</span></div></section><section className="panel agenda-panel"><PanelHeader title="Citas del día" meta="Ordenadas por hora"><div className="segmented-control"><button className="selected" type="button">Todas</button><button type="button" onClick={() => onNotify('Filtro de citas confirmado')}>Pendientes</button><button type="button" onClick={() => onNotify('Filtro de citas confirmado')}>Atendidas</button></div></PanelHeader><div className="agenda-list">{appointments.map((appointment) => <div className="agenda-row" key={appointment.id}><div className="agenda-time">{appointment.time}<span>30 min</span></div><div className="agenda-line"></div><div className={`avatar avatar-${appointment.tone}`}>{appointment.initials}</div><div className="agenda-patient"><strong>{appointment.patient}</strong><span>{appointment.specialty} · {appointment.doctor}</span></div><StatusPill tone={appointment.tone} label={appointment.status} /><button type="button" className="button button-small button-secondary" onClick={() => appointment.status === 'Confirmada' ? onMarkArrival(appointment.id) : onNotify(`Cita ${appointment.id} seleccionada`)}>{appointment.status === 'Confirmada' ? 'Registrar llegada' : 'Ver detalle'}</button></div>)}</div></section></>
}

function GenericModuleView({ module, onAction }: { module: { title: string; description: string; action: string; icon: string }; onAction: () => void }) {
  return <><section className="page-heading compact-heading"><div><span className="eyebrow">Módulo operativo</span><h1>{module.title}</h1><p>{module.description}</p></div><button type="button" className="button button-primary" onClick={onAction}><Icon symbol="+" /> {module.action}</button></section><section className="module-empty panel"><div className="module-empty-icon"><Icon symbol={module.icon} /></div><span className="eyebrow">Datos simulados</span><h2>El módulo está listo para comenzar</h2><p>Esta vista ya tiene su espacio dentro del sistema. La información aparecerá aquí cuando conectemos los servicios del backend.</p><button type="button" className="button button-secondary" onClick={onAction}>Explorar módulo</button></section></>
}

function AppointmentModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="appointment-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">Agenda</span><h2 id="appointment-title">Nueva cita</h2></div><button type="button" className="close-button" aria-label="Cerrar" onClick={onClose}>×</button></div><div className="form-grid"><label>Paciente<select defaultValue="Valeria Quispe Mamani"><option>Valeria Quispe Mamani</option><option>Marco Antonio Rojas</option><option>Lucía Fernández Paz</option></select></label><label>Especialidad<select defaultValue="Medicina interna"><option>Medicina interna</option><option>Cardiología</option><option>Pediatría</option></select></label><label>Fecha<input type="date" defaultValue="2026-07-16" /></label><label>Hora<select defaultValue="11:00"><option>11:00</option><option>11:30</option><option>12:00</option></select></label></div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="button" className="button button-primary" onClick={onSave}>Confirmar cita</button></div></div></div>
}

export default App
