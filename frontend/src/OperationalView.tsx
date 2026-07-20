import { useCallback, useEffect, useState } from 'react'
import { api, type AdministrationOverview, type BillingOverview, type InventoryOverview, type LaboratoryOverview, type PharmacyOverview, type ReportsOverview } from './api'

export type OperationalModule = 'laboratorio' | 'farmacia' | 'inventario' | 'facturacion' | 'reportes' | 'administracion'

type Overview = LaboratoryOverview | PharmacyOverview | InventoryOverview | BillingOverview | ReportsOverview | AdministrationOverview

const moduleTitles: Record<OperationalModule, { title: string; description: string }> = {
  laboratorio: { title: 'Laboratorio', description: 'Ordenes, muestras y resultados consultados desde PostgreSQL.' },
  farmacia: { title: 'Farmacia', description: 'Medicamentos, lotes, stock y recetas disponibles.' },
  inventario: { title: 'Inventario', description: 'Existencias, ubicaciones, lotes y movimientos registrados.' },
  facturacion: { title: 'Facturacion', description: 'Cargos, facturas y pagos registrados en el sistema.' },
  reportes: { title: 'Reportes', description: 'Indicadores operativos calculados con datos reales.' },
  administracion: { title: 'Administracion', description: 'Usuarios, roles y auditoria de operaciones.' },
}

export function OperationalView({ module, onNotify }: { module: OperationalModule; onNotify: (message: string) => void }) {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const title = moduleTitles[module]

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = module === 'laboratorio'
        ? await api.getLaboratoryOverview()
        : module === 'farmacia'
          ? await api.getPharmacyOverview()
          : module === 'inventario'
            ? await api.getInventoryOverview()
            : module === 'facturacion'
              ? await api.getBillingOverview()
              : module === 'reportes'
                ? await api.getReportsOverview()
                : await api.getAdministrationOverview()
      setData(response)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el modulo.')
    } finally {
      setLoading(false)
    }
  }, [module])

  useEffect(() => { void load() }, [load])

  const refresh = async () => {
    await load()
    onNotify(`${title.title} actualizado desde el backend`)
  }

  return <>
    <section className="page-heading compact-heading">
      <div><span className="eyebrow">Modulo operativo</span><h1>{title.title}</h1><p>{title.description}</p></div>
      <button type="button" className="button button-primary" onClick={() => void refresh()} disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar datos'}</button>
    </section>
    {loading && !data ? <section className="panel operation-loading">Consultando el backend...</section> : error ? <section className="panel operation-error"><strong>No se pudo cargar {title.title.toLowerCase()}</strong><span>{error}</span><button type="button" className="button button-secondary" onClick={() => void load()}>Reintentar</button></section> : data && <OperationContent module={module} data={data} />}
  </>
}

function OperationContent({ module, data }: { module: OperationalModule; data: Overview }) {
  if (module === 'laboratorio') return <LaboratoryContent data={data as LaboratoryOverview} />
  if (module === 'farmacia') return <PharmacyContent data={data as PharmacyOverview} />
  if (module === 'inventario') return <InventoryContent data={data as InventoryOverview} />
  if (module === 'facturacion') return <BillingContent data={data as BillingOverview} />
  if (module === 'reportes') return <ReportsContent data={data as ReportsOverview} />
  return <AdministrationContent data={data as AdministrationOverview} />
}

function SummaryCards({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return <div className="operation-summary">{items.map((item) => <div className="operation-stat" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
}

function LaboratoryContent({ data }: { data: LaboratoryOverview }) {
  const catalog = asArray(data.catalog)
  const orders = asArray(data.orders)

  return <>
    <SummaryCards items={[{ label: 'Ordenes totales', value: data.summary?.totalOrders ?? 0 }, { label: 'Pendientes', value: data.summary?.pendingOrders ?? 0 }, { label: 'Completadas', value: data.summary?.completedOrders ?? 0 }, { label: 'Pruebas catalogadas', value: catalog.length }]} />
    <section className="operation-grid"><section className="panel operation-panel"><PanelTitle title="Catalogo de pruebas" meta="Origen: lab_test_catalog" /><DataTable headers={['Codigo', 'Prueba', 'Muestra', 'Precio']} rows={catalog.map((test) => [fallback(test.code), fallback(test.name), test.sampleType ?? 'No definido', formatMoney(test.price)])} empty="No hay pruebas catalogadas." /></section><section className="panel operation-panel"><PanelTitle title="Ordenes recientes" meta="Origen: lab_order" /><DataTable headers={['Orden', 'Paciente', 'Estado', 'Pruebas']} rows={orders.map((order) => [fallback(order.orderCode), `${fallback(order.patientName)} (${fallback(order.patientCode)})`, humanize(order.status), order.testCount ?? 0])} empty="No hay ordenes de laboratorio." /></section></section>
  </>
}

function PharmacyContent({ data }: { data: PharmacyOverview }) {
  const medications = asArray(data.medications)
  const prescriptions = asArray(data.prescriptions)

  return <>
    <SummaryCards items={[{ label: 'Medicamentos', value: data.summary?.medicationCount ?? 0 }, { label: 'Activos', value: data.summary?.activeMedicationCount ?? 0 }, { label: 'Stock bajo', value: data.summary?.lowStockCount ?? 0 }, { label: 'Recetas', value: prescriptions.length }]} />
    <section className="operation-grid"><section className="panel operation-panel operation-panel-wide"><PanelTitle title="Existencias de farmacia" meta="Origen: medication e inventory_stock" /><DataTable headers={['Codigo', 'Medicamento', 'Presentacion', 'Disponible', 'Minimo', 'Proximo vencimiento']} rows={medications.map((medication) => [fallback(medication.code), fallback(medication.genericName), `${fallback(medication.presentation)}${medication.concentration ? ` · ${medication.concentration}` : ''}`, medication.availableQuantity ?? 0, medication.minimumStock ?? 0, medication.nextExpiry ?? 'Sin lote'])} empty="No hay medicamentos registrados." /></section><section className="panel operation-panel"><PanelTitle title="Recetas recientes" meta="Origen: prescription" /><DataTable headers={['Receta', 'Paciente', 'Estado']} rows={prescriptions.map((prescription) => [fallback(prescription.prescriptionCode), fallback(prescription.patientName), humanize(prescription.status)])} empty="No hay recetas registradas." /></section></section>
  </>
}

function InventoryContent({ data }: { data: InventoryOverview }) {
  const stock = asArray(data.stock)
  const movements = asArray(data.movements)

  return <>
    <SummaryCards items={[{ label: 'Lineas de stock', value: data.summary?.stockLines ?? 0 }, { label: 'Unidades disponibles', value: data.summary?.totalUnits ?? 0 }, { label: 'Stock bajo', value: data.summary?.lowStockLines ?? 0 }, { label: 'Vencen pronto', value: data.summary?.expiringSoonLines ?? 0 }]} />
    <section className="operation-grid"><section className="panel operation-panel operation-panel-wide"><PanelTitle title="Stock por lote y ubicacion" meta="Origen: inventory_stock" /><DataTable headers={['Medicamento', 'Lote', 'Ubicacion', 'Disponible', 'Vence']} rows={stock.map((item) => [fallback(item.genericName), fallback(item.batchCode), fallback(item.locationName), item.availableQuantity ?? 0, fallback(item.expiresOn)])} empty="No hay existencias registradas." /></section><section className="panel operation-panel"><PanelTitle title="Movimientos recientes" meta="Origen: stock_movement" /><DataTable headers={['Codigo', 'Tipo', 'Medicamento', 'Cantidad']} rows={movements.map((movement) => [fallback(movement.movementCode), humanize(movement.movementType), fallback(movement.genericName), movement.quantity ?? 0])} empty="No hay movimientos registrados." /></section></section>
  </>
}

function BillingContent({ data }: { data: BillingOverview }) {
  const invoices = asArray(data.invoices)
  const payments = asArray(data.payments)

  return <>
    <SummaryCards items={[{ label: 'Cargos', value: data.summary?.chargeCount ?? 0 }, { label: 'Cargos pendientes', value: data.summary?.pendingChargeCount ?? 0 }, { label: 'Monto pendiente', value: formatMoney(data.summary?.pendingAmount ?? 0) }, { label: 'Facturas', value: invoices.length }]} />
    <section className="operation-grid"><section className="panel operation-panel operation-panel-wide"><PanelTitle title="Facturas recientes" meta="Origen: invoice" /><DataTable headers={['Factura', 'Paciente', 'Estado', 'Total']} rows={invoices.map((invoice) => [fallback(invoice.invoiceCode), fallback(invoice.patientName), humanize(invoice.status), `${fallback(invoice.currency, 'Bs')} ${formatNumber(invoice.total)}`])} empty="No hay facturas registradas." /></section><section className="panel operation-panel"><PanelTitle title="Pagos recientes" meta="Origen: payment" /><DataTable headers={['Pago', 'Factura', 'Metodo', 'Monto']} rows={payments.map((payment) => [fallback(payment.paymentCode), fallback(payment.invoiceCode), humanize(payment.paymentMethod), formatMoney(payment.amount)])} empty="No hay pagos registrados." /></section></section>
  </>
}

function ReportsContent({ data }: { data: ReportsOverview }) {
  const appointmentsByStatus = asArray(data.appointmentsByStatus)
  const appointmentsBySpecialty = asArray(data.appointmentsBySpecialty)

  return <>
    <SummaryCards items={[{ label: 'Pacientes activos', value: data.summary?.activePatients ?? 0 }, { label: 'Citas activas', value: data.summary?.activeAppointments ?? 0 }, { label: 'Consultas', value: data.summary?.consultations ?? 0 }, { label: 'Unidades en inventario', value: data.summary?.inventoryUnits ?? 0 }]} />
    <section className="operation-grid"><section className="panel operation-panel"><PanelTitle title="Citas por estado" meta="Consulta agregada" /><DataTable headers={['Estado', 'Cantidad']} rows={appointmentsByStatus.map((item) => [humanize(item.status), item.count ?? 0])} empty="No hay citas para reportar." /></section><section className="panel operation-panel"><PanelTitle title="Demanda por especialidad" meta="Consulta agregada" /><DataTable headers={['Especialidad', 'Citas']} rows={appointmentsBySpecialty.map((item) => [fallback(item.specialty), item.count ?? 0])} empty="No hay especialidades para reportar." /></section></section>
  </>
}

function AdministrationContent({ data }: { data: AdministrationOverview }) {
  const users = asArray(data.users)
  const audit = asArray(data.audit)

  return <>
    <SummaryCards items={[{ label: 'Usuarios', value: data.summary?.userCount ?? 0 }, { label: 'Activos', value: data.summary?.activeUserCount ?? 0 }, { label: 'Bloqueados', value: data.summary?.lockedUserCount ?? 0 }, { label: 'Eventos de auditoria', value: data.summary?.auditEventCount ?? 0 }]} />
    <section className="operation-grid"><section className="panel operation-panel operation-panel-wide"><PanelTitle title="Usuarios y roles" meta="Origen: app_user" /><DataTable headers={['Usuario', 'Nombre', 'Roles', 'Estado']} rows={users.map((user) => [fallback(user.username), fallback(user.displayName), fallback(user.roles, 'Sin rol'), humanize(user.status)])} empty="No hay usuarios registrados." /></section><section className="panel operation-panel"><PanelTitle title="Auditoria reciente" meta="Origen: audit_event" /><DataTable headers={['Accion', 'Entidad', 'Resultado', 'Usuario']} rows={audit.map((event) => [humanize(event.action), humanize(event.entityType), event.success ? 'Correcto' : 'Fallido', event.username ?? 'Sistema'])} empty="No hay eventos de auditoria." /></section></section>
  </>
}

function PanelTitle({ title, meta }: { title: string; meta: string }) {
  return <div className="operation-panel-title"><div><h2>{title}</h2><span>{meta}</span></div></div>
}

function DataTable({ headers, rows, empty }: { headers: string[]; rows: Array<Array<string | number>>; empty: string }) {
  return <div className="table-wrap operation-table"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={headers.length}><div className="empty-state"><strong>{empty}</strong></div></td></tr> : rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{value}</td>)}</tr>)}</tbody></table></div>
}

function asArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : []
}

function fallback(value: string | number | null | undefined, defaultValue = 'No definido') {
  return value ?? defaultValue
}

function humanize(value: string | null | undefined) {
  if (!value) return 'No definido'
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatMoney(value: number) {
  return `Bs ${formatNumber(value)}`
}

function formatNumber(value: number) {
  return Number(value ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
