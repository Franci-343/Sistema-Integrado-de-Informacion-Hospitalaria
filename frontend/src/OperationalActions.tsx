import { CircleDollarSign, FilePlus2, PackagePlus, Pill, Plus, RefreshCw, TestTube2, Truck, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  api,
  type BatchStock,
  type Charge,
  type Consultation,
  type Invoice,
  type InventoryLocation,
  type LabOrder,
  type LabOrderItem,
  type LabTest,
  type Medication,
  type Patient,
  type Prescription,
  type ServiceItem,
} from './api'
import { useAuth } from './auth/auth-context'
import { PERMISSIONS } from './auth/permissions'
import type { OperationalModule } from './OperationalView'

export function OperationalActions({ module, onChanged, onNotify }: { module: Exclude<OperationalModule, 'administracion'>; onChanged: () => Promise<void>; onNotify: (message: string) => void }) {
  if (module === 'laboratorio') return <LaboratoryActions onChanged={onChanged} onNotify={onNotify} />
  if (module === 'farmacia') return <PharmacyActions onChanged={onChanged} onNotify={onNotify} />
  if (module === 'inventario') return <InventoryActions onChanged={onChanged} onNotify={onNotify} />
  if (module === 'facturacion') return <BillingActions onChanged={onChanged} onNotify={onNotify} />
  return null
}

function LaboratoryActions({ onChanged, onNotify }: ActionProps) {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.LAB_WRITE)
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [tests, setTests] = useState<LabTest[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [modal, setModal] = useState<'order' | 'result' | null>(null)
  const [selectedItem, setSelectedItem] = useState<LabOrderItem | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [orderList, testList, patientPage] = await Promise.all([
        api.getLabOrders(), api.getLabTests(), canWrite ? api.getPatients('', 0, 100) : Promise.resolve(null),
      ])
      setOrders(orderList); setTests(testList); setPatients(patientPage?.content ?? []); setError('')
    } catch (reason) { setError(errorMessage(reason)) }
  }, [canWrite])
  useEffect(() => { void load() }, [load])

  const refreshAll = async (message?: string) => {
    await Promise.all([load(), onChanged()])
    if (message) onNotify(message)
  }

  const advance = async (order: LabOrder) => {
    setBusy(order.id); setError('')
    try {
      if (order.status === 'REQUESTED') {
        await api.receiveLabSample(order.id, order.items[0]?.sampleType ?? 'Muestra clínica')
        await refreshAll('Muestra recibida y vinculada a la orden')
        return
      }
      if (order.status === 'RECEIVED' && order.samples[0]) {
        await api.updateLabSample(order.id, order.samples[0].id, 'IN_PROCESS')
        await refreshAll('Muestra marcada en proceso')
        return
      }
      const item = order.items.find((candidate) => candidate.result?.status !== 'PUBLISHED')
      if (!item) return
      if (!item.result) {
        setSelectedItem(item); setModal('result')
        return
      }
      if (item.result.status === 'DRAFT') {
        await api.validateLabResult(item.result.id)
        await refreshAll('Resultado validado')
        return
      }
      if (item.result.status === 'VALIDATED') {
        await api.publishLabResult(item.result.id)
        await refreshAll('Resultado publicado y notificado')
      }
    } catch (reason) { setError(errorMessage(reason)) } finally { setBusy('') }
  }

  return <>
    <WorkflowPanel icon={<TestTube2 />} title="Flujo de laboratorio" subtitle="Procesa órdenes hasta publicar sus resultados" actions={canWrite ? <button type="button" className="button button-primary" onClick={() => setModal('order')}><Plus aria-hidden="true" /> Nueva orden</button> : null}>
      {error && <InlineError message={error} />}
      <div className="workflow-list">{orders.slice(0, 6).map((order) => {
        const action = labActionLabel(order)
        return <div className="workflow-row" key={order.id}><span><strong>{order.orderCode} · {order.patientName}</strong><small>{order.items.map((item) => item.testName).join(', ')}</small></span><Status value={order.status} />{canWrite && action && <button type="button" className="button button-secondary" disabled={busy === order.id} onClick={() => void advance(order)}>{busy === order.id ? 'Procesando...' : action}</button>}</div>
      })}{orders.length === 0 && <Empty text="No hay órdenes de laboratorio activas." />}</div>
    </WorkflowPanel>
    {modal === 'order' && <LabOrderModal patients={patients} tests={tests} onClose={() => setModal(null)} onSave={async (payload) => { await api.createLabOrder(payload); setModal(null); await refreshAll('Orden de laboratorio creada') }} />}
    {modal === 'result' && selectedItem && <LabResultModal item={selectedItem} onClose={() => setModal(null)} onSave={async (payload) => { await api.saveLabResult(payload); setModal(null); await refreshAll('Resultado guardado en borrador') }} />}
  </>
}

function LabOrderModal({ patients, tests, onClose, onSave }: { patients: Patient[]; tests: LabTest[]; onClose: () => void; onSave: (payload: { consultationId: string; testIds: string[]; clinicalNotes?: string; idempotencyKey: string }) => Promise<void> }) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '')
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [consultationId, setConsultationId] = useState('')
  const [testIds, setTestIds] = useState<string[]>(tests[0] ? [tests[0].id] : [])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!patientId) return
    api.getPatientConsultations(patientId).then((items) => { setConsultations(items); setConsultationId(items[0]?.id ?? '') }).catch((reason) => setError(errorMessage(reason)))
  }, [patientId])

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    try { await onSave({ consultationId, testIds, clinicalNotes: notes || undefined, idempotencyKey: crypto.randomUUID() }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) }
  }
  const toggleTest = (id: string) => setTestIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  return <ActionModal title="Nueva orden de laboratorio" eyebrow="Solicitud clínica" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><SelectField label="Paciente" value={patientId} onChange={setPatientId} options={patients.map((patient) => ({ value: patient.id, label: `${patient.fullName} · ${patient.patientCode}` }))} /><SelectField label="Consulta" value={consultationId} onChange={setConsultationId} options={consultations.map((item) => ({ value: item.id, label: `${item.consultationCode} · ${item.chiefComplaint}` }))} /><fieldset className="choice-field form-span-two"><legend>Pruebas solicitadas</legend><div className="check-grid">{tests.filter((test) => test.active).map((test) => <label key={test.id}><input type="checkbox" checked={testIds.includes(test.id)} onChange={() => toggleTest(test.id)} /><span><strong>{test.name}</strong><small>{test.sampleType} · Bs {test.price.toFixed(2)}</small></span></label>)}</div></fieldset><TextArea label="Notas clínicas" value={notes} onChange={setNotes} span /></div>{error && <ModalError message={error} />}<ModalFooter onClose={onClose} saving={saving} label="Crear orden" disabled={!consultationId || testIds.length === 0} /></form></ActionModal>
}

function LabResultModal({ item, onClose, onSave }: { item: LabOrderItem; onClose: () => void; onSave: (payload: { orderItemId: string; resultText?: string; numericValue?: number; unit?: string; referenceRange?: string; observations?: string }) => Promise<void> }) {
  const [resultText, setResultText] = useState('')
  const [numericValue, setNumericValue] = useState('')
  const [observations, setObservations] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave({ orderItemId: item.id, resultText: resultText || undefined, numericValue: numericValue ? Number(numericValue) : undefined, observations: observations || undefined }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <ActionModal title={`Resultado: ${item.testName}`} eyebrow="Procesamiento de muestra" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><TextField label="Valor numérico" type="number" value={numericValue} onChange={setNumericValue} /><TextField label="Resultado textual" value={resultText} onChange={setResultText} /><TextArea label="Observaciones" value={observations} onChange={setObservations} span /></div>{error && <ModalError message={error} />}<ModalFooter onClose={onClose} saving={saving} label="Guardar resultado" disabled={!resultText.trim() && !numericValue} /></form></ActionModal>
}

function PharmacyActions({ onChanged, onNotify }: ActionProps) {
  const { hasPermission } = useAuth()
  const canPrescribe = hasPermission(PERMISSIONS.CLINICAL_WRITE)
  const canDispense = hasPermission(PERMISSIONS.PHARMACY_WRITE)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [batches, setBatches] = useState<BatchStock[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [modal, setModal] = useState<'prescription' | 'dispense' | null>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [rx, meds, stock, patientPage] = await Promise.all([
        api.getPrescriptions(),
        api.getMedications(),
        canDispense ? api.getInventoryBatches(undefined, true) : Promise.resolve([]),
        canPrescribe ? api.getPatients('', 0, 100) : Promise.resolve(null),
      ])
      setPrescriptions(rx); setMedications(meds); setBatches(stock); setPatients(patientPage?.content ?? []); setError('')
    } catch (reason) { setError(errorMessage(reason)) }
  }, [canDispense, canPrescribe])
  useEffect(() => { void load() }, [load])
  const refreshAll = async (message: string) => { await Promise.all([load(), onChanged()]); onNotify(message) }

  return <>
    <WorkflowPanel icon={<Pill />} title="Prescripción y dispensación" subtitle="Entrega segura contra receta y lote vigente" actions={canPrescribe ? <button type="button" className="button button-primary" onClick={() => setModal('prescription')}><FilePlus2 aria-hidden="true" /> Nueva receta</button> : null}>
      {error && <InlineError message={error} />}
      <div className="workflow-list">{prescriptions.slice(0, 6).map((rx) => <div className="workflow-row" key={rx.id}><span><strong>{rx.prescriptionCode} · {rx.patientName}</strong><small>{rx.items.map((item) => `${item.medicationName} ${item.dose}`).join(', ')}</small></span><Status value={rx.status} />{canDispense && ['ISSUED', 'PARTIALLY_DISPENSED'].includes(rx.status) && <button type="button" className="button button-secondary" onClick={() => { setSelectedPrescription(rx); setModal('dispense') }}>Dispensar</button>}</div>)}{prescriptions.length === 0 && <Empty text="No hay recetas registradas." />}</div>
    </WorkflowPanel>
    {modal === 'prescription' && <PrescriptionModal patients={patients} medications={medications} onClose={() => setModal(null)} onSave={async (payload) => { await api.createPrescription(payload); setModal(null); await refreshAll('Receta emitida correctamente') }} />}
    {modal === 'dispense' && selectedPrescription && <DispensationModal prescription={selectedPrescription} batches={batches} onClose={() => setModal(null)} onSave={async (payload) => { await api.createDispensation(payload); setModal(null); await refreshAll('Medicamento dispensado y stock actualizado') }} />}
  </>
}

function PrescriptionModal({ patients, medications, onClose, onSave }: { patients: Patient[]; medications: Medication[]; onClose: () => void; onSave: (payload: { consultationId: string; validUntil?: string; notes?: string; idempotencyKey: string; items: Array<{ medicationId: string; dose: string; route: string; frequency: string; duration: string; quantity: number; instructions: string }> }) => Promise<void> }) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '')
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [form, setForm] = useState({ consultationId: '', medicationId: medications[0]?.id ?? '', dose: '', route: 'ORAL', frequency: '', duration: '', quantity: '1', instructions: '', notes: '', validUntil: dateAfter(30) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (patientId) api.getPatientConsultations(patientId).then((items) => { setConsultations(items); setForm((current) => ({ ...current, consultationId: items[0]?.id ?? '' })) }).catch((reason) => setError(errorMessage(reason))) }, [patientId])
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave({ consultationId: form.consultationId, validUntil: form.validUntil, notes: form.notes || undefined, idempotencyKey: crypto.randomUUID(), items: [{ medicationId: form.medicationId, dose: form.dose, route: form.route, frequency: form.frequency, duration: form.duration, quantity: Number(form.quantity), instructions: form.instructions }] }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <ActionModal title="Emitir receta" eyebrow="Tratamiento farmacológico" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><SelectField label="Paciente" value={patientId} onChange={setPatientId} options={patients.map((item) => ({ value: item.id, label: `${item.fullName} · ${item.patientCode}` }))} /><SelectField label="Consulta" value={form.consultationId} onChange={(value) => setForm({ ...form, consultationId: value })} options={consultations.map((item) => ({ value: item.id, label: `${item.consultationCode} · ${item.chiefComplaint}` }))} /><SelectField label="Medicamento" value={form.medicationId} onChange={(value) => setForm({ ...form, medicationId: value })} options={medications.filter((item) => item.active).map((item) => ({ value: item.id, label: `${item.genericName} · ${item.presentation}` }))} /><TextField label="Dosis" value={form.dose} onChange={(value) => setForm({ ...form, dose: value })} placeholder="500 mg" /><TextField label="Vía" value={form.route} onChange={(value) => setForm({ ...form, route: value })} /><TextField label="Frecuencia" value={form.frequency} onChange={(value) => setForm({ ...form, frequency: value })} placeholder="Cada 8 horas" /><TextField label="Duración" value={form.duration} onChange={(value) => setForm({ ...form, duration: value })} placeholder="7 días" /><TextField label="Cantidad" type="number" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} /><TextField label="Válida hasta" type="date" value={form.validUntil} onChange={(value) => setForm({ ...form, validUntil: value })} /><TextField label="Indicaciones" value={form.instructions} onChange={(value) => setForm({ ...form, instructions: value })} /><TextArea label="Notas" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} span /></div>{error && <ModalError message={error} />}<ModalFooter onClose={onClose} saving={saving} label="Emitir receta" disabled={!form.consultationId || !form.medicationId || !form.dose.trim() || !form.frequency.trim() || !form.duration.trim() || !form.instructions.trim()} /></form></ActionModal>
}

function DispensationModal({ prescription, batches, onClose, onSave }: { prescription: Prescription; batches: BatchStock[]; onClose: () => void; onSave: (payload: { prescriptionId: string; idempotencyKey: string; notes?: string; items: Array<{ prescriptionItemId: string; batchId: string; quantity: number }> }) => Promise<void> }) {
  const pendingItems = prescription.items.filter((item) => item.quantityDispensed < item.quantityPrescribed)
  const [itemId, setItemId] = useState(pendingItems[0]?.id ?? '')
  const selectedItem = pendingItems.find((item) => item.id === itemId)
  const validBatches = batches.filter((batch) => batch.medicationId === selectedItem?.medicationId && batch.availableQuantity > 0)
  const defaultBatchId = validBatches[0]?.batchId ?? ''
  const [batchId, setBatchId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setBatchId(defaultBatchId) }, [defaultBatchId])
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave({ prescriptionId: prescription.id, idempotencyKey: crypto.randomUUID(), notes: notes || undefined, items: [{ prescriptionItemId: itemId, batchId, quantity: Number(quantity) }] }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <ActionModal title={`Dispensar ${prescription.prescriptionCode}`} eyebrow={prescription.patientName} onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><SelectField label="Medicamento pendiente" value={itemId} onChange={setItemId} options={pendingItems.map((item) => ({ value: item.id, label: `${item.medicationName} · saldo ${item.quantityPrescribed - item.quantityDispensed}` }))} /><SelectField label="Lote vigente" value={batchId} onChange={setBatchId} options={validBatches.map((batch) => ({ value: batch.batchId, label: `${batch.batchCode} · ${batch.availableQuantity} disponibles · vence ${batch.expiresOn}` }))} /><TextField label="Cantidad" type="number" value={quantity} onChange={setQuantity} /><TextArea label="Observaciones de entrega" value={notes} onChange={setNotes} span /></div>{error && <ModalError message={error} />}<ModalFooter onClose={onClose} saving={saving} label="Confirmar entrega" disabled={!itemId || !batchId || Number(quantity) <= 0} /></form></ActionModal>
}

function InventoryActions({ onChanged, onNotify }: ActionProps) {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.INVENTORY_WRITE)
  const [medications, setMedications] = useState<Medication[]>([])
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [batches, setBatches] = useState<BatchStock[]>([])
  const [modal, setModal] = useState<'batch' | 'movement' | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => { try { const [meds, locationList, stock] = await Promise.all([api.getMedications(), api.getInventoryLocations(), api.getInventoryBatches()]); setMedications(meds); setLocations(locationList); setBatches(stock); setError('') } catch (reason) { setError(errorMessage(reason)) } }, [])
  useEffect(() => { void load() }, [load])
  const refreshAll = async (message: string) => { await Promise.all([load(), onChanged()]); onNotify(message) }
  if (!canWrite) return null
  return <>
    <WorkflowPanel icon={<Truck />} title="Operaciones de inventario" subtitle="Registra lotes, entradas, salidas, transferencias y ajustes" actions={<><button type="button" className="button button-secondary" onClick={() => setModal('movement')}><RefreshCw aria-hidden="true" /> Movimiento</button><button type="button" className="button button-primary" onClick={() => setModal('batch')}><PackagePlus aria-hidden="true" /> Nuevo lote</button></>}>
      {error && <InlineError message={error} />}<div className="workflow-list compact-workflow-list">{batches.slice(0, 5).map((batch) => <div className="workflow-row" key={`${batch.batchId}-${batch.locationId}`}><span><strong>{batch.medicationName} · {batch.batchCode}</strong><small>{batch.locationName} · vence {batch.expiresOn}</small></span><b>{batch.availableQuantity}</b></div>)}</div>
    </WorkflowPanel>
    {modal === 'batch' && <BatchModal medications={medications} locations={locations} onClose={() => setModal(null)} onSave={async (payload) => { await api.createInventoryBatch(payload); setModal(null); await refreshAll('Lote y stock inicial registrados') }} />}
    {modal === 'movement' && <MovementModal batches={batches} locations={locations} onClose={() => setModal(null)} onSave={async (payload) => { await api.createStockMovement(payload); setModal(null); await refreshAll('Movimiento de inventario aplicado') }} />}
  </>
}

function BatchModal({ medications, locations, onClose, onSave }: { medications: Medication[]; locations: InventoryLocation[]; onClose: () => void; onSave: (payload: { medicationId: string; batchCode: string; receivedOn: string; expiresOn: string; unitCost: number; supplierName?: string; locationId: string; initialQuantity: number; idempotencyKey: string }) => Promise<void> }) {
  const [form, setForm] = useState({ medicationId: medications[0]?.id ?? '', locationId: locations[0]?.id ?? '', batchCode: '', receivedOn: today(), expiresOn: dateAfter(365), unitCost: '0', supplierName: '', initialQuantity: '0' })
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave({ ...form, unitCost: Number(form.unitCost), initialQuantity: Number(form.initialQuantity), supplierName: form.supplierName || undefined, idempotencyKey: crypto.randomUUID() }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <ActionModal title="Registrar lote" eyebrow="Ingreso de inventario" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><SelectField label="Medicamento" value={form.medicationId} onChange={(value) => setForm({ ...form, medicationId: value })} options={medications.map((item) => ({ value: item.id, label: `${item.genericName} · ${item.presentation}` }))} /><TextField label="Código de lote" value={form.batchCode} onChange={(value) => setForm({ ...form, batchCode: value })} /><SelectField label="Ubicación" value={form.locationId} onChange={(value) => setForm({ ...form, locationId: value })} options={locations.map((item) => ({ value: item.id, label: item.name }))} /><TextField label="Proveedor" value={form.supplierName} onChange={(value) => setForm({ ...form, supplierName: value })} /><TextField label="Fecha de recepción" type="date" value={form.receivedOn} onChange={(value) => setForm({ ...form, receivedOn: value })} /><TextField label="Fecha de vencimiento" type="date" value={form.expiresOn} onChange={(value) => setForm({ ...form, expiresOn: value })} /><TextField label="Costo unitario" type="number" value={form.unitCost} onChange={(value) => setForm({ ...form, unitCost: value })} /><TextField label="Cantidad inicial" type="number" value={form.initialQuantity} onChange={(value) => setForm({ ...form, initialQuantity: value })} /></div>{error && <ModalError message={error} />}<ModalFooter onClose={onClose} saving={saving} label="Registrar lote" disabled={!form.medicationId || !form.locationId || !form.batchCode.trim()} /></form></ActionModal>
}

function MovementModal({ batches, locations, onClose, onSave }: { batches: BatchStock[]; locations: InventoryLocation[]; onClose: () => void; onSave: (payload: { batchId: string; movementType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'; sourceLocationId?: string; targetLocationId?: string; adjustmentDirection?: 'INCREASE' | 'DECREASE'; quantity: number; reason?: string; idempotencyKey: string }) => Promise<void> }) {
  const [form, setForm] = useState({ batchId: batches[0]?.batchId ?? '', movementType: 'IN' as 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT', sourceLocationId: locations[0]?.id ?? '', targetLocationId: locations[0]?.id ?? '', adjustmentDirection: 'INCREASE' as 'INCREASE' | 'DECREASE', quantity: '1', reason: '' })
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); const isIncrease = form.movementType === 'IN' || (form.movementType === 'ADJUSTMENT' && form.adjustmentDirection === 'INCREASE'); try { await onSave({ batchId: form.batchId, movementType: form.movementType, sourceLocationId: ['OUT', 'TRANSFER'].includes(form.movementType) || (form.movementType === 'ADJUSTMENT' && !isIncrease) ? form.sourceLocationId : undefined, targetLocationId: ['IN', 'TRANSFER'].includes(form.movementType) || isIncrease ? form.targetLocationId : undefined, adjustmentDirection: form.movementType === 'ADJUSTMENT' ? form.adjustmentDirection : undefined, quantity: Number(form.quantity), reason: form.reason || undefined, idempotencyKey: crypto.randomUUID() }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <ActionModal title="Movimiento de stock" eyebrow="Inventario" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><SelectField label="Lote" value={form.batchId} onChange={(value) => setForm({ ...form, batchId: value })} options={uniqueBatches(batches).map((item) => ({ value: item.batchId, label: `${item.medicationName} · ${item.batchCode}` }))} /><SelectField label="Tipo" value={form.movementType} onChange={(value) => setForm({ ...form, movementType: value as typeof form.movementType })} options={[{ value: 'IN', label: 'Entrada' }, { value: 'OUT', label: 'Salida' }, { value: 'TRANSFER', label: 'Transferencia' }, { value: 'ADJUSTMENT', label: 'Ajuste' }]} />{form.movementType === 'ADJUSTMENT' && <SelectField label="Dirección del ajuste" value={form.adjustmentDirection} onChange={(value) => setForm({ ...form, adjustmentDirection: value as typeof form.adjustmentDirection })} options={[{ value: 'INCREASE', label: 'Incrementar' }, { value: 'DECREASE', label: 'Disminuir' }]} />}{['OUT', 'TRANSFER'].includes(form.movementType) || (form.movementType === 'ADJUSTMENT' && form.adjustmentDirection === 'DECREASE') ? <SelectField label="Ubicación origen" value={form.sourceLocationId} onChange={(value) => setForm({ ...form, sourceLocationId: value })} options={locations.map((item) => ({ value: item.id, label: item.name }))} /> : null}{['IN', 'TRANSFER'].includes(form.movementType) || (form.movementType === 'ADJUSTMENT' && form.adjustmentDirection === 'INCREASE') ? <SelectField label="Ubicación destino" value={form.targetLocationId} onChange={(value) => setForm({ ...form, targetLocationId: value })} options={locations.map((item) => ({ value: item.id, label: item.name }))} /> : null}<TextField label="Cantidad" type="number" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} /><TextArea label="Motivo" value={form.reason} onChange={(value) => setForm({ ...form, reason: value })} span /></div>{error && <ModalError message={error} />}<ModalFooter onClose={onClose} saving={saving} label="Aplicar movimiento" disabled={!form.batchId || Number(form.quantity) <= 0 || (form.movementType === 'ADJUSTMENT' && !form.reason.trim())} /></form></ActionModal>
}

function BillingActions({ onChanged, onNotify }: ActionProps) {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.BILLING_WRITE)
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [charges, setCharges] = useState<Charge[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [modal, setModal] = useState<'charge' | 'invoice' | 'payment' | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(async () => { if (!canWrite) return; try { const [patientPage, catalog, chargeList, invoiceList] = await Promise.all([api.getPatients('', 0, 100), api.getServices(), api.getCharges(), api.getInvoices()]); setPatients(patientPage.content); setServices(catalog); setCharges(chargeList); setInvoices(invoiceList); setError('') } catch (reason) { setError(errorMessage(reason)) } }, [canWrite])
  useEffect(() => { if (canWrite) void load() }, [canWrite, load])
  const refreshAll = async (message: string) => { await Promise.all([load(), onChanged()]); onNotify(message) }
  const issue = async (invoice: Invoice) => { setBusy(invoice.id); try { await api.issueInvoice(invoice.id); await refreshAll('Factura emitida correctamente') } catch (reason) { setError(errorMessage(reason)) } finally { setBusy('') } }
  if (!canWrite) return null
  return <>
    <WorkflowPanel icon={<CircleDollarSign />} title="Caja y facturación" subtitle="Convierte prestaciones en facturas y registra su pago" actions={<><button type="button" className="button button-secondary" onClick={() => setModal('charge')}><Plus aria-hidden="true" /> Cargo</button><button type="button" className="button button-primary" disabled={!charges.some((item) => item.status === 'PENDING')} onClick={() => setModal('invoice')}><FilePlus2 aria-hidden="true" /> Nueva factura</button></>}>
      {error && <InlineError message={error} />}<div className="workflow-list">{invoices.slice(0, 6).map((invoice) => <div className="workflow-row" key={invoice.id}><span><strong>{invoice.invoiceCode} · {invoice.patientName}</strong><small>Total Bs {invoice.total.toFixed(2)} · saldo Bs {invoice.balance.toFixed(2)}</small></span><Status value={invoice.status} />{invoice.status === 'DRAFT' && <button type="button" className="button button-secondary" disabled={busy === invoice.id} onClick={() => void issue(invoice)}>Emitir</button>}{['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status) && <button type="button" className="button button-primary" onClick={() => { setSelectedInvoice(invoice); setModal('payment') }}>Cobrar</button>}</div>)}{invoices.length === 0 && <Empty text="No hay facturas registradas." />}</div>
    </WorkflowPanel>
    {modal === 'charge' && <ChargeModal patients={patients} services={services} onClose={() => setModal(null)} onSave={async (payload) => { await api.createCharge(payload); setModal(null); await refreshAll('Cargo registrado') }} />}
    {modal === 'invoice' && <InvoiceModal patients={patients} charges={charges.filter((item) => item.status === 'PENDING')} onClose={() => setModal(null)} onSave={async (payload) => { await api.createInvoice(payload); setModal(null); await refreshAll('Factura creada en borrador') }} />}
    {modal === 'payment' && selectedInvoice && <PaymentModal invoice={selectedInvoice} onClose={() => setModal(null)} onSave={async (payload) => { await api.createPayment(payload); setModal(null); await refreshAll('Pago confirmado') }} />}
  </>
}

function ChargeModal({ patients, services, onClose, onSave }: { patients: Patient[]; services: ServiceItem[]; onClose: () => void; onSave: (payload: { patientId: string; serviceId: string; quantity: number; unitPrice?: number; idempotencyKey: string }) => Promise<void> }) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? ''); const [serviceId, setServiceId] = useState(services[0]?.id ?? ''); const [quantity, setQuantity] = useState('1'); const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave({ patientId, serviceId, quantity: Number(quantity), idempotencyKey: crypto.randomUUID() }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <ActionModal title="Registrar cargo" eyebrow="Prestación facturable" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><SelectField label="Paciente" value={patientId} onChange={setPatientId} options={patients.map((item) => ({ value: item.id, label: `${item.fullName} · ${item.patientCode}` }))} /><SelectField label="Servicio" value={serviceId} onChange={setServiceId} options={services.filter((item) => item.active).map((item) => ({ value: item.id, label: `${item.name} · Bs ${item.defaultPrice.toFixed(2)}` }))} /><TextField label="Cantidad" type="number" value={quantity} onChange={setQuantity} /></div>{error && <ModalError message={error} />}<ModalFooter onClose={onClose} saving={saving} label="Registrar cargo" disabled={!patientId || !serviceId || Number(quantity) <= 0} /></form></ActionModal>
}

function InvoiceModal({ patients, charges, onClose, onSave }: { patients: Patient[]; charges: Charge[]; onClose: () => void; onSave: (payload: { patientId: string; chargeIds: string[]; discount: number; tax: number; idempotencyKey: string }) => Promise<void> }) {
  const patientIds = [...new Set(charges.map((item) => item.patientId))]
  const availablePatients = patients.filter((patient) => patientIds.includes(patient.id))
  const [patientId, setPatientId] = useState(availablePatients[0]?.id ?? '')
  const patientCharges = charges.filter((item) => item.patientId === patientId)
  const [selected, setSelected] = useState<string[]>([])
  const [discount, setDiscount] = useState('0'); const [tax, setTax] = useState('0'); const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  useEffect(() => { setSelected(charges.filter((item) => item.patientId === patientId).map((item) => item.id)) }, [charges, patientId])
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave({ patientId, chargeIds: selected, discount: Number(discount), tax: Number(tax), idempotencyKey: crypto.randomUUID() }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <ActionModal title="Crear factura" eyebrow="Cargos pendientes" onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><SelectField label="Paciente" value={patientId} onChange={setPatientId} options={availablePatients.map((item) => ({ value: item.id, label: `${item.fullName} · ${item.patientCode}` }))} /><div /><fieldset className="choice-field form-span-two"><legend>Cargos a incluir</legend><div className="check-grid">{patientCharges.map((charge) => <label key={charge.id}><input type="checkbox" checked={selected.includes(charge.id)} onChange={() => setSelected((current) => current.includes(charge.id) ? current.filter((id) => id !== charge.id) : [...current, charge.id])} /><span><strong>{charge.description}</strong><small>{charge.chargeCode} · Bs {charge.subtotal.toFixed(2)}</small></span></label>)}</div></fieldset><TextField label="Descuento" type="number" value={discount} onChange={setDiscount} /><TextField label="Impuesto" type="number" value={tax} onChange={setTax} /></div>{error && <ModalError message={error} />}<ModalFooter onClose={onClose} saving={saving} label="Crear factura" disabled={!patientId || selected.length === 0} /></form></ActionModal>
}

function PaymentModal({ invoice, onClose, onSave }: { invoice: Invoice; onClose: () => void; onSave: (payload: { invoiceId: string; amount: number; paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'QR' | 'OTHER'; idempotencyKey: string }) => Promise<void> }) {
  const [amount, setAmount] = useState(String(invoice.balance)); const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'QR' | 'OTHER'>('CASH'); const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { await onSave({ invoiceId: invoice.id, amount: Number(amount), paymentMethod, idempotencyKey: crypto.randomUUID() }) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) } }
  return <ActionModal title={`Cobrar ${invoice.invoiceCode}`} eyebrow={`${invoice.patientName} · saldo Bs ${invoice.balance.toFixed(2)}`} onClose={onClose}><form onSubmit={(event) => void submit(event)}><div className="form-grid"><TextField label="Monto" type="number" value={amount} onChange={setAmount} /><SelectField label="Método" value={paymentMethod} onChange={(value) => setPaymentMethod(value as typeof paymentMethod)} options={[{ value: 'CASH', label: 'Efectivo' }, { value: 'CARD', label: 'Tarjeta' }, { value: 'TRANSFER', label: 'Transferencia' }, { value: 'QR', label: 'QR' }, { value: 'OTHER', label: 'Otro' }]} /></div>{error && <ModalError message={error} />}<ModalFooter onClose={onClose} saving={saving} label="Confirmar pago" disabled={Number(amount) <= 0 || Number(amount) > invoice.balance} /></form></ActionModal>
}

type ActionProps = { onChanged: () => Promise<void>; onNotify: (message: string) => void }

function WorkflowPanel({ icon, title, subtitle, actions, children }: { icon: ReactNode; title: string; subtitle: string; actions: ReactNode; children: ReactNode }) {
  return <section className="panel workflow-panel"><div className="workflow-header"><span className="workflow-icon">{icon}</span><div><h2>{title}</h2><p>{subtitle}</p></div><div className="workflow-actions">{actions}</div></div>{children}</section>
}

function ActionModal({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal operational-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><button type="button" className="close-button" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></button></div>{children}</div></div>
}

function ModalFooter({ onClose, saving, label, disabled }: { onClose: () => void; saving: boolean; label: string; disabled: boolean }) {
  return <div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={disabled || saving}>{saving ? 'Guardando...' : label}</button></div>
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label>{label}<select required value={value} onChange={(event) => onChange(event.target.value)}><option value="" disabled>Seleccionar</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function TextField({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label>{label}<input required type={type} step={type === 'number' ? '0.01' : undefined} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>
}

function TextArea({ label, value, onChange, span = false }: { label: string; value: string; onChange: (value: string) => void; span?: boolean }) {
  return <label className={span ? 'form-span-two' : undefined}>{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function Status({ value }: { value: string }) {
  const tone = ['ACTIVE', 'AVAILABLE', 'CONFIRMED', 'PAID', 'PUBLISHED', 'DISPENSED', 'VALIDATED'].includes(value) ? 'green' : ['CANCELLED', 'REJECTED', 'INACTIVE', 'LOCKED'].includes(value) ? 'amber' : 'blue'
  return <span className={`status-pill status-${tone}`}><i />{humanize(value)}</span>
}

function Empty({ text }: { text: string }) { return <div className="empty-inline workflow-empty">{text}</div> }
function InlineError({ message }: { message: string }) { return <div className="workflow-error">{message}</div> }
function ModalError({ message }: { message: string }) { return <p className="modal-error">{message}</p> }

function labActionLabel(order: LabOrder) {
  if (order.status === 'REQUESTED') return 'Recibir muestra'
  if (order.status === 'RECEIVED') return 'Iniciar proceso'
  const item = order.items.find((candidate) => candidate.result?.status !== 'PUBLISHED')
  if (!item) return null
  if (!item.result) return 'Cargar resultado'
  if (item.result.status === 'DRAFT') return 'Validar'
  if (item.result.status === 'VALIDATED') return 'Publicar'
  return null
}

function uniqueBatches(items: BatchStock[]) {
  return items.filter((item, index) => items.findIndex((candidate) => candidate.batchId === item.batchId) === index)
}

function humanize(value: string) { return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function errorMessage(reason: unknown) { return reason instanceof Error ? reason.message : 'Ocurrió un error al comunicarse con el backend.' }
function today() { return new Date().toISOString().slice(0, 10) }
function dateAfter(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10) }
