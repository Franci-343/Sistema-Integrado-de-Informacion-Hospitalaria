import { Activity, BedDouble, ClipboardList, ClipboardPlus, DoorOpen, Plus, RefreshCw, Search, Stethoscope, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { api, type Bed, type DischargeCreateRequest, type Hospitalization, type HospitalizationOrder, type HospitalizationOrderCreateRequest, type HospitalizationOrigin, type NursingNoteCreateRequest, type Patient, type Professional, type Triage, type TriageRequest } from './api'

type ClinicalModule = 'triaje' | 'hospitalizacion'

export function ClinicalOperationsView({ module, canWrite, onNotify }: { module: ClinicalModule; canWrite: boolean; onNotify: (message: string) => void }) {
  const [triage, setTriage] = useState<Triage[]>([])
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([])
  const [hospitalizationOrders, setHospitalizationOrders] = useState<HospitalizationOrder[]>([])
  const [hospitalizationOrigins, setHospitalizationOrigins] = useState<HospitalizationOrigin[]>([])
  const [beds, setBeds] = useState<Bed[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<'triage' | 'order' | 'admit' | 'note' | 'discharge' | null>(null)
  const [selectedHospitalization, setSelectedHospitalization] = useState<Hospitalization | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const patientRequest = api.getPatients('', 0, 100)
      if (module === 'triaje') {
        const [records, patientPage] = await Promise.all([api.getTriage(), patientRequest])
        setTriage(records)
        setPatients(patientPage.content)
      } else {
        const [stays, bedList, patientPage, professionalList, origins, orders] = await Promise.all([
          api.getHospitalizations(), api.getBeds(), patientRequest, api.getProfessionals(), api.getHospitalizationOrigins(), api.getHospitalizationOrders(),
        ])
        setHospitalizations(stays)
        setBeds(bedList)
        setPatients(patientPage.content)
        setProfessionals(professionalList)
        setHospitalizationOrigins(origins)
        setHospitalizationOrders(orders)
      }
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }, [module])

  useEffect(() => { void load() }, [load])

  const refresh = async () => {
    await load()
    onNotify('Datos clÃ­nicos actualizados desde el backend')
  }

  const filteredTriage = useMemo(() => triage.filter((item) => matches(query, item.patientName, item.patientCode, item.encounterCode, item.priority)), [query, triage])
  const filteredStays = useMemo(() => hospitalizations.filter((item) => matches(query, item.patientName, item.patientCode, item.hospitalizationCode, item.status, item.bedCode)), [hospitalizations, query])

  const openStayAction = (action: 'note' | 'discharge', stay: Hospitalization) => {
    setSelectedHospitalization(stay)
    setModal(action)
  }

  return <>
    <section className="page-heading compact-heading">
      <div>
        <span className="eyebrow">AtenciÃ³n clÃ­nica</span>
        <h1>{module === 'triaje' ? 'Triaje' : 'HospitalizaciÃ³n'}</h1>
        <p>{module === 'triaje' ? 'PriorizaciÃ³n y registro de signos vitales de pacientes.' : 'Admisiones, camas, notas de enfermerÃ­a y altas hospitalarias.'}</p>
      </div>
      <div className="heading-actions">
        <button type="button" className="button button-secondary" onClick={() => void refresh()} disabled={loading}><RefreshCw aria-hidden="true" /> Actualizar</button>
        {canWrite && module === 'hospitalizacion' && <button type="button" className="button button-secondary" onClick={() => setModal('order')}><ClipboardList aria-hidden="true" /> Nueva orden</button>}
        {canWrite && <button type="button" className="button button-primary" onClick={() => setModal(module === 'triaje' ? 'triage' : 'admit')}><Plus aria-hidden="true" /> {module === 'triaje' ? 'Nuevo triaje' : 'Ingresar paciente'}</button>}
      </div>
    </section>

    <div className="operation-toolbar">
      <label className="search-field"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar paciente, cÃ³digo o estado" />{query && <button type="button" aria-label="Limpiar bÃºsqueda" onClick={() => setQuery('')}><X aria-hidden="true" /></button>}</label>
      <span>{loading ? 'Sincronizando...' : `${module === 'triaje' ? filteredTriage.length : filteredStays.length} registros`}</span>
    </div>

    {error && <div className="connection-banner" role="alert"><strong>No se pudo cargar:</strong> {error}<button type="button" onClick={() => void load()}>Reintentar</button></div>}
    {module === 'triaje'
      ? <TriageContent records={filteredTriage} loading={loading} />
      : <HospitalizationContent stays={filteredStays} beds={beds} orders={hospitalizationOrders} loading={loading} canWrite={canWrite} onAction={openStayAction} />}

    {modal === 'triage' && <TriageModal patients={patients} onClose={() => setModal(null)} onSave={async (payload) => { await api.createTriage(payload); setModal(null); onNotify('Triaje registrado correctamente'); await load() }} />}
    {modal === 'order' && <HospitalizationOrderModal origins={hospitalizationOrigins} professionals={professionals.filter((professional) => professional.professionalType === 'DOCTOR')} onClose={() => setModal(null)} onSave={async (payload) => { await api.createHospitalizationOrder(payload); setModal(null); onNotify('Orden de internacion registrada'); await load() }} />}
    {modal === 'admit' && <AdmissionModal orders={hospitalizationOrders.filter((order) => order.status === 'PENDING')} beds={beds.filter((bed) => bed.status === 'AVAILABLE')} onClose={() => setModal(null)} onSave={async (payload) => { await api.admitPatient(payload); setModal(null); onNotify('Ingreso hospitalario registrado'); await load() }} />}
    {modal === 'note' && selectedHospitalization && <NursingNoteModal onClose={() => setModal(null)} onSave={async (payload) => { await api.addNursingNote(selectedHospitalization.id, payload); setModal(null); onNotify('Nota de enfermeria guardada'); await load() }} />}
    {modal === 'discharge' && selectedHospitalization && <DischargeModal onClose={() => setModal(null)} onSave={async (payload) => { await api.dischargePatient(selectedHospitalization.id, payload); setModal(null); onNotify('Alta hospitalaria registrada'); await load() }} />}
  </>
}

function TriageContent({ records, loading }: { records: Triage[]; loading: boolean }) {
  const urgent = records.filter((item) => ['RED', 'ORANGE'].includes(item.priority)).length
  const today = new Date().toDateString()
  const todayCount = records.filter((item) => new Date(item.recordedAt).toDateString() === today).length
  return <>
    <div className="operation-summary">
      <Summary icon={<Activity />} label="Evaluaciones" value={records.length} />
      <Summary icon={<ClipboardPlus />} label="Registradas hoy" value={todayCount} />
      <Summary icon={<Stethoscope />} label="Prioridad alta" value={urgent} />
      <Summary icon={<Activity />} label="SaturaciÃ³n menor a 92%" value={records.filter((item) => item.oxygenSaturation !== null && item.oxygenSaturation < 92).length} />
    </div>
    <section className="panel operation-panel operation-panel-wide">
      <PanelHeading title="Evaluaciones recientes" subtitle="Prioridad y signos vitales registrados" />
      <div className="table-wrap operation-table"><table><thead><tr><th>Paciente</th><th>Prioridad</th><th>Temperatura</th><th>PresiÃ³n</th><th>FC</th><th>SpOâ‚‚</th><th>Registro</th></tr></thead><tbody>
        {loading ? <EmptyRow columns={7} text="Cargando triaje..." /> : records.length === 0 ? <EmptyRow columns={7} text="No hay evaluaciones de triaje." /> : records.map((item) => <tr key={item.id}><td><strong>{item.patientName}</strong><small>{item.patientCode} Â· {item.encounterCode}</small></td><td><Priority value={item.priority} /></td><td>{value(item.temperatureC, ' Â°C')}</td><td>{item.systolicBp && item.diastolicBp ? `${item.systolicBp}/${item.diastolicBp}` : '--'}</td><td>{value(item.heartRate, ' lpm')}</td><td>{value(item.oxygenSaturation, '%')}</td><td>{formatDateTime(item.recordedAt)}</td></tr>)}
      </tbody></table></div>
    </section>
  </>
}

function HospitalizationContent({ stays, beds, orders, loading, canWrite, onAction }: { stays: Hospitalization[]; beds: Bed[]; orders: HospitalizationOrder[]; loading: boolean; canWrite: boolean; onAction: (action: 'note' | 'discharge', stay: Hospitalization) => void }) {
  const active = stays.filter((item) => item.status === 'ADMITTED')
  const pendingOrders = orders.filter((item) => item.status === 'PENDING')
  return <>
    <div className="operation-summary">
      <Summary icon={<BedDouble />} label="Camas totales" value={beds.length} />
      <Summary icon={<BedDouble />} label="Camas disponibles" value={beds.filter((item) => item.status === 'AVAILABLE').length} />
      <Summary icon={<Stethoscope />} label="Hospitalizados" value={active.length} />
      <Summary icon={<ClipboardList />} label="Ordenes pendientes" value={pendingOrders.length} />
      <Summary icon={<DoorOpen />} label="Altas registradas" value={stays.filter((item) => item.status === 'DISCHARGED').length} />
    </div>
    <section className="clinical-operation-grid">
      <section className="panel operation-panel operation-panel-wide">
        <PanelHeading title="Ingresos hospitalarios" subtitle="OcupaciÃ³n y seguimiento clÃ­nico" />
        <div className="table-wrap operation-table"><table><thead><tr><th>Ingreso</th><th>Paciente</th><th>Cama</th><th>Responsable</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
          {loading ? <EmptyRow columns={6} text="Cargando hospitalizaciones..." /> : stays.length === 0 ? <EmptyRow columns={6} text="No hay ingresos hospitalarios." /> : stays.map((stay) => <tr key={stay.id}><td><strong>{stay.hospitalizationCode}</strong><small>{formatDateTime(stay.admittedAt)}{stay.originEncounterCode ? ` - ${stay.originEncounterCode}` : ''}</small></td><td><strong>{stay.patientName}</strong><small>{stay.patientCode}</small></td><td>{stay.room} / {stay.bed}<small>{stay.bedServiceCode || 'Sin servicio'}</small></td><td>{stay.responsibleProfessional}</td><td><Status value={stay.status} /></td><td><div className="table-actions">{canWrite && stay.status === 'ADMITTED' && <><button type="button" className="button button-secondary" onClick={() => onAction('note', stay)}>Nota</button><button type="button" className="button button-danger" onClick={() => onAction('discharge', stay)}>Alta</button></>}</div></td></tr>)}
        </tbody></table></div>
      </section>
      <section className="panel operation-panel operation-panel-wide">
        <PanelHeading title="Ordenes de internacion" subtitle="Pendientes de cama y admision" />
        <div className="table-wrap operation-table"><table><thead><tr><th>Orden</th><th>Paciente</th><th>Origen</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>
          {loading ? <EmptyRow columns={5} text="Cargando ordenes..." /> : pendingOrders.length === 0 ? <EmptyRow columns={5} text="No hay ordenes pendientes." /> : pendingOrders.map((order) => <tr key={order.id}><td><strong>{order.orderCode}</strong><small>{formatDateTime(order.orderedAt)}</small></td><td><strong>{order.patientName}</strong><small>{order.patientCode}</small></td><td>{order.originEncounterCode}<small>{humanize(order.originEncounterType)}</small></td><td>{order.destinationService}</td><td><Status value={order.status} /></td></tr>)}
        </tbody></table></div>
      </section>
      <section className="panel bed-panel">
        <PanelHeading title="Mapa de camas" subtitle={`${beds.filter((item) => item.status === 'AVAILABLE').length} disponibles`} />
        <div className="bed-list">{beds.map((bed) => <div key={bed.id} className={`bed-row bed-${bed.status.toLowerCase()}`}><BedDouble aria-hidden="true" /><span><strong>{bed.room} Â· Cama {bed.bed}</strong><small>{bed.serviceCode || 'Sin servicio'} Â· {bed.code}</small></span><Status value={bed.status} /></div>)}</div>
      </section>
    </section>
  </>
}

function TriageModal({ patients, onClose, onSave }: { patients: Patient[]; onClose: () => void; onSave: (payload: TriageRequest) => Promise<void> }) {
  const [form, setForm] = useState({ patientId: patients[0]?.id ?? '', priority: 'GREEN' as Triage['priority'], temperatureC: '36.5', systolicBp: '120', diastolicBp: '80', heartRate: '75', respiratoryRate: '16', oxygenSaturation: '98', weightKg: '', heightCm: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      await onSave({ patientId: form.patientId, priority: form.priority, temperatureC: numberOrNull(form.temperatureC), systolicBp: numberOrNull(form.systolicBp), diastolicBp: numberOrNull(form.diastolicBp), heartRate: numberOrNull(form.heartRate), respiratoryRate: numberOrNull(form.respiratoryRate), oxygenSaturation: numberOrNull(form.oxygenSaturation), weightKg: numberOrNull(form.weightKg), heightCm: numberOrNull(form.heightCm), notes: form.notes || null })
    } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) }
  }
  return <Modal title="Registrar triaje" eyebrow="EvaluaciÃ³n inicial" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><Select label="Paciente" value={form.patientId} onChange={(value) => setForm({ ...form, patientId: value })} options={patients.map((patient) => ({ value: patient.id, label: `${patient.fullName} Â· ${patient.patientCode}` }))} /><Select label="Prioridad" value={form.priority} onChange={(value) => setForm({ ...form, priority: value as Triage['priority'] })} options={['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'].map((item) => ({ value: item, label: priorityLabel(item) }))} /><NumberField label="Temperatura Â°C" value={form.temperatureC} onChange={(value) => setForm({ ...form, temperatureC: value })} step="0.1" /><NumberField label="SaturaciÃ³n Oâ‚‚ %" value={form.oxygenSaturation} onChange={(value) => setForm({ ...form, oxygenSaturation: value })} step="0.1" /><NumberField label="PresiÃ³n sistÃ³lica" value={form.systolicBp} onChange={(value) => setForm({ ...form, systolicBp: value })} /><NumberField label="PresiÃ³n diastÃ³lica" value={form.diastolicBp} onChange={(value) => setForm({ ...form, diastolicBp: value })} /><NumberField label="Frecuencia cardÃ­aca" value={form.heartRate} onChange={(value) => setForm({ ...form, heartRate: value })} /><NumberField label="Frecuencia respiratoria" value={form.respiratoryRate} onChange={(value) => setForm({ ...form, respiratoryRate: value })} /><NumberField label="Peso kg" value={form.weightKg} onChange={(value) => setForm({ ...form, weightKg: value })} step="0.1" /><NumberField label="Talla cm" value={form.heightCm} onChange={(value) => setForm({ ...form, heightCm: value })} step="0.1" /><label className="form-span-two">Observaciones<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label></div>{error && <p className="modal-error">{error}</p>}<ModalFooter onClose={onClose} saving={saving} label="Registrar triaje" disabled={!form.patientId} /></form></Modal>
}

function HospitalizationOrderModal({ origins, professionals, onClose, onSave }: { origins: HospitalizationOrigin[]; professionals: Professional[]; onClose: () => void; onSave: (payload: HospitalizationOrderCreateRequest) => Promise<void> }) {
  const [form, setForm] = useState({ originEncounterId: origins[0]?.encounterId ?? '', responsibleProfessionalId: professionals[0]?.id ?? '', reason: '', presumptiveDiagnosis: '', destinationService: origins[0]?.encounterType === 'EMERGENCY' ? 'EMERGENCY' : 'MED_INT' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave(form) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <Modal title="Nueva orden de internacion" eyebrow="Consulta o emergencia" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><Select label="Atencion de origen" value={form.originEncounterId} onChange={(value) => setForm({ ...form, originEncounterId: value })} options={origins.map((origin) => ({ value: origin.encounterId, label: `${origin.patientName} - ${origin.encounterCode} (${humanize(origin.encounterType)})` }))} /><Select label="Medico responsable" value={form.responsibleProfessionalId} onChange={(value) => setForm({ ...form, responsibleProfessionalId: value })} options={professionals.map((professional) => ({ value: professional.id, label: `${professional.displayName} - ${professional.professionalCode}` }))} /><label>Servicio destino<select value={form.destinationService} onChange={(event) => setForm({ ...form, destinationService: event.target.value })}><option value="MED_INT">Medicina interna</option><option value="CARD">Cardiologia</option><option value="PED">Pediatria</option><option value="TRAUMA">Traumatologia</option><option value="GYN">Ginecologia</option><option value="EMERGENCY">Emergencias</option></select></label><label className="form-span-two">Motivo<textarea required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label><label className="form-span-two">Diagnostico presuntivo<textarea required value={form.presumptiveDiagnosis} onChange={(event) => setForm({ ...form, presumptiveDiagnosis: event.target.value })} /></label></div>{error && <p className="modal-error">{error}</p>}<ModalFooter onClose={onClose} saving={saving} label="Crear orden" disabled={!form.originEncounterId || !form.responsibleProfessionalId || !form.reason.trim() || !form.presumptiveDiagnosis.trim()} /></form></Modal>
}

function AdmissionModal({ orders, beds, onClose, onSave }: { orders: HospitalizationOrder[]; beds: Bed[]; onClose: () => void; onSave: (payload: { hospitalizationOrderId: string; bedId: string; admissionReason?: string }) => Promise<void> }) {
  const [form, setForm] = useState({ hospitalizationOrderId: orders[0]?.id ?? '', bedId: '', admissionReason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const selectedOrder = orders.find((order) => order.id === form.hospitalizationOrderId)
  const compatibleBeds = selectedOrder ? beds.filter((bed) => !bed.serviceCode || bed.serviceCode === selectedOrder.destinationService) : beds
  const bedId = compatibleBeds.some((bed) => bed.id === form.bedId) ? form.bedId : compatibleBeds[0]?.id ?? ''
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave({ hospitalizationOrderId: form.hospitalizationOrderId, bedId, admissionReason: form.admissionReason || undefined }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <Modal title="Ingresar paciente" eyebrow="Orden de internacion" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><Select label="Orden pendiente" value={form.hospitalizationOrderId} onChange={(value) => setForm({ ...form, hospitalizationOrderId: value, bedId: '' })} options={orders.map((order) => ({ value: order.id, label: `${order.orderCode} - ${order.patientName} (${order.destinationService})` }))} /><Select label="Cama compatible" value={bedId} onChange={(value) => setForm({ ...form, bedId: value })} options={compatibleBeds.map((bed) => ({ value: bed.id, label: `${bed.room} - Cama ${bed.bed} - ${bed.serviceCode || 'Sin servicio'}` }))} /><label className="form-span-two">Motivo de ingreso<textarea value={form.admissionReason} onChange={(event) => setForm({ ...form, admissionReason: event.target.value })} placeholder={selectedOrder?.reason ?? ''} /></label></div>{error && <p className="modal-error">{error}</p>}<ModalFooter onClose={onClose} saving={saving} label="Confirmar ingreso" disabled={!form.hospitalizationOrderId || !bedId} /></form></Modal>
}

function NursingNoteModal({ onClose, onSave }: { onClose: () => void; onSave: (payload: NursingNoteCreateRequest) => Promise<void> }) {
  const [form, setForm] = useState({ temperatureC: '36.5', systolicBp: '120', diastolicBp: '80', heartRate: '75', respiratoryRate: '16', oxygenSaturation: '98', glucoseMgDl: '', weightKg: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const payload = (): NursingNoteCreateRequest => ({ temperatureC: numberOrNull(form.temperatureC), systolicBp: numberOrNull(form.systolicBp), diastolicBp: numberOrNull(form.diastolicBp), heartRate: numberOrNull(form.heartRate), respiratoryRate: numberOrNull(form.respiratoryRate), oxygenSaturation: numberOrNull(form.oxygenSaturation), glucoseMgDl: numberOrNull(form.glucoseMgDl), weightKg: numberOrNull(form.weightKg), note: form.note })
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave(payload()) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <Modal title="Agregar nota de enfermeria" eyebrow="Signos vitales" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><NumberField label="Temperatura C" value={form.temperatureC} onChange={(value) => setForm({ ...form, temperatureC: value })} step="0.1" /><NumberField label="Saturacion O2 %" value={form.oxygenSaturation} onChange={(value) => setForm({ ...form, oxygenSaturation: value })} step="0.1" /><NumberField label="Presion sistolica" value={form.systolicBp} onChange={(value) => setForm({ ...form, systolicBp: value })} /><NumberField label="Presion diastolica" value={form.diastolicBp} onChange={(value) => setForm({ ...form, diastolicBp: value })} /><NumberField label="Frecuencia cardiaca" value={form.heartRate} onChange={(value) => setForm({ ...form, heartRate: value })} /><NumberField label="Frecuencia respiratoria" value={form.respiratoryRate} onChange={(value) => setForm({ ...form, respiratoryRate: value })} /><NumberField label="Glucemia mg/dL" value={form.glucoseMgDl} onChange={(value) => setForm({ ...form, glucoseMgDl: value })} step="0.1" /><NumberField label="Peso kg" value={form.weightKg} onChange={(value) => setForm({ ...form, weightKg: value })} step="0.1" /><label className="form-span-two">Observaciones<textarea required value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label></div>{error && <p className="modal-error">{error}</p>}<ModalFooter onClose={onClose} saving={saving} label="Guardar nota" disabled={!form.note.trim()} /></form></Modal>
}

function DischargeModal({ onClose, onSave }: { onClose: () => void; onSave: (payload: DischargeCreateRequest) => Promise<void> }) {
  const [form, setForm] = useState({ dischargeDiagnosis: '', dischargeType: 'MEDICAL' as DischargeCreateRequest['dischargeType'], dischargeInstructions: '', followUpPlan: '', medicationsOnDischarge: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave({ dischargeDiagnosis: form.dischargeDiagnosis, dischargeType: form.dischargeType, dischargeInstructions: form.dischargeInstructions, followUpPlan: form.followUpPlan || null, medicationsOnDischarge: form.medicationsOnDischarge || null }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <Modal title="Registrar alta hospitalaria" eyebrow="Resumen de egreso" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><label>Tipo de alta<select value={form.dischargeType} onChange={(event) => setForm({ ...form, dischargeType: event.target.value as DischargeCreateRequest['dischargeType'] })}><option value="MEDICAL">Medica</option><option value="VOLUNTARY">Voluntaria</option><option value="TRANSFER">Transferencia</option><option value="DEATH">Defuncion</option><option value="ABANDONMENT">Fuga</option></select></label><label className="form-span-two">Diagnostico de egreso<textarea required value={form.dischargeDiagnosis} onChange={(event) => setForm({ ...form, dischargeDiagnosis: event.target.value })} /></label><label className="form-span-two">Indicaciones de alta<textarea required value={form.dischargeInstructions} onChange={(event) => setForm({ ...form, dischargeInstructions: event.target.value })} /></label><label className="form-span-two">Plan de seguimiento<textarea value={form.followUpPlan} onChange={(event) => setForm({ ...form, followUpPlan: event.target.value })} /></label><label className="form-span-two">Medicacion de egreso<textarea value={form.medicationsOnDischarge} onChange={(event) => setForm({ ...form, medicationsOnDischarge: event.target.value })} /></label></div>{error && <p className="modal-error">{error}</p>}<ModalFooter onClose={onClose} saving={saving} label="Confirmar alta" disabled={!form.dischargeDiagnosis.trim() || !form.dischargeInstructions.trim()} /></form></Modal>
}

function Modal({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal clinical-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><button type="button" className="close-button" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></button></div>{children}</div></div>
}

function ModalFooter({ onClose, saving, label, disabled }: { onClose: () => void; saving: boolean; label: string; disabled: boolean }) {
  return <div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={disabled || saving}>{saving ? 'Guardando...' : label}</button></div>
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label>{label}<select required value={value} onChange={(event) => onChange(event.target.value)}><option value="" disabled>Seleccionar</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function NumberField({ label, value, onChange, step = '1' }: { label: string; value: string; onChange: (value: string) => void; step?: string }) {
  return <label>{label}<input type="number" step={step} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function Summary({ icon, label, value: amount }: { icon: ReactNode; label: string; value: number }) {
  return <div className="operation-stat operation-stat-icon"><span className="summary-symbol">{icon}</span><span>{label}</span><strong>{amount}</strong></div>
}

function PanelHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="operation-panel-title"><div><h2>{title}</h2><span>{subtitle}</span></div></div>
}

function EmptyRow({ columns, text }: { columns: number; text: string }) {
  return <tr><td colSpan={columns}><div className="empty-state"><strong>{text}</strong></div></td></tr>
}

function Priority({ value: priority }: { value: string }) {
  return <span className={`clinical-priority priority-${priority.toLowerCase()}`}>{priorityLabel(priority)}</span>
}

function Status({ value: status }: { value: string }) {
  return <span className={`status-pill status-${['ACTIVE', 'AVAILABLE', 'CONFIRMED'].includes(status) ? 'green' : status === 'DISCHARGED' ? 'blue' : 'amber'}`}><i />{humanize(status)}</span>
}

function matches(query: string, ...values: string[]) {
  const normalized = query.trim().toLocaleLowerCase('es')
  return !normalized || values.some((item) => item.toLocaleLowerCase('es').includes(normalized))
}

function numberOrNull(value: string) {
  return value === '' ? null : Number(value)
}

function priorityLabel(value: string) {
  return ({ RED: 'Rojo', ORANGE: 'Naranja', YELLOW: 'Amarillo', GREEN: 'Verde', BLUE: 'Azul' } as Record<string, string>)[value] ?? value
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function value(amount: number | null, suffix: string) {
  return amount === null ? '--' : `${amount}${suffix}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
}

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'OcurriÃ³ un error al comunicarse con el backend.'
}
