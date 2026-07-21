import { Download, RefreshCw, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api, type AdministrationOverview, type BillingOverview, type InventoryOverview, type LaboratoryOverview, type PharmacyOverview, type ReportsOverview } from './api'

export type OperationalModule = 'laboratorio' | 'farmacia' | 'inventario' | 'facturacion' | 'reportes' | 'administracion'

type Overview = LaboratoryOverview | PharmacyOverview | InventoryOverview | BillingOverview | ReportsOverview | AdministrationOverview

const moduleTitles: Record<OperationalModule, { title: string; description: string }> = {
  laboratorio: { title: 'Laboratorio', description: 'Órdenes, muestras y resultados disponibles para seguimiento.' },
  farmacia: { title: 'Farmacia', description: 'Medicamentos, lotes, stock y recetas disponibles.' },
  inventario: { title: 'Inventario', description: 'Existencias, ubicaciones, lotes y movimientos registrados.' },
  facturacion: { title: 'Facturación', description: 'Cargos, facturas y pagos registrados en el sistema.' },
  reportes: { title: 'Reportes', description: 'Indicadores operativos calculados con datos reales.' },
  administracion: { title: 'Administración', description: 'Usuarios, roles y auditoría de operaciones.' },
}

export function OperationalView({ module, onNotify, canExport = false }: { module: OperationalModule; onNotify: (message: string) => void; canExport?: boolean }) {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
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

  const exportData = () => {
    if (!data) return
    downloadOverview(module, data)
    onNotify(`${title.title} exportado en formato CSV`)
  }

  return <>
    <section className="page-heading compact-heading">
      <div><span className="eyebrow">Módulo operativo</span><h1>{title.title}</h1><p>{title.description}</p></div>
      <div className="heading-actions">{canExport && <button type="button" className="button button-secondary" onClick={exportData} disabled={!data}><Download aria-hidden="true" /> Exportar CSV</button>}<button type="button" className="button button-primary" onClick={() => void refresh()} disabled={loading}><RefreshCw aria-hidden="true" /> {loading ? 'Actualizando...' : 'Actualizar'}</button></div>
    </section>
    {data && <div className="operation-toolbar"><label className="search-field"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar en ${title.title.toLowerCase()}`} aria-label={`Buscar en ${title.title.toLowerCase()}`} />{query && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery('')}>×</button>}</label><span>{loading ? 'Sincronizando...' : 'Datos sincronizados con la API'}</span></div>}
    {loading && !data ? <section className="panel operation-loading">Consultando el backend...</section> : error ? <section className="panel operation-error"><strong>No se pudo cargar {title.title.toLowerCase()}</strong><span>{error}</span><button type="button" className="button button-secondary" onClick={() => void load()}>Reintentar</button></section> : data && <OperationContent module={module} data={data} query={query} />}
  </>
}

function OperationContent({ module, data, query }: { module: OperationalModule; data: Overview; query: string }) {
  if (module === 'laboratorio') return <LaboratoryContent data={data as LaboratoryOverview} query={query} />
  if (module === 'farmacia') return <PharmacyContent data={data as PharmacyOverview} query={query} />
  if (module === 'inventario') return <InventoryContent data={data as InventoryOverview} query={query} />
  if (module === 'facturacion') return <BillingContent data={data as BillingOverview} query={query} />
  if (module === 'reportes') return <ReportsContent data={data as ReportsOverview} query={query} />
  return <AdministrationContent data={data as AdministrationOverview} query={query} />
}

function SummaryCards({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return <div className="operation-summary">{items.map((item) => <div className="operation-stat" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
}

function LaboratoryContent({ data, query }: { data: LaboratoryOverview; query: string }) {
  const catalog = asArray(data.catalog).filter((item) => matchesQuery(query, item.code, item.name, item.sampleType))
  const orders = asArray(data.orders).filter((item) => matchesQuery(query, item.orderCode, item.patientCode, item.patientName, item.status))

  return <>
    <SummaryCards items={[{ label: 'Ordenes totales', value: data.summary?.totalOrders ?? 0 }, { label: 'Pendientes', value: data.summary?.pendingOrders ?? 0 }, { label: 'Completadas', value: data.summary?.completedOrders ?? 0 }, { label: 'Pruebas catalogadas', value: catalog.length }]} />
    <section className="operation-grid"><section className="panel operation-panel"><PanelTitle title="Catalogo de pruebas" meta="Origen: lab_test_catalog" /><DataTable headers={['Codigo', 'Prueba', 'Muestra', 'Precio']} rows={catalog.map((test) => [fallback(test.code), fallback(test.name), test.sampleType ?? 'No definido', formatMoney(test.price)])} empty="No hay pruebas catalogadas." /></section><section className="panel operation-panel"><PanelTitle title="Ordenes recientes" meta="Origen: lab_order" /><DataTable headers={['Orden', 'Paciente', 'Estado', 'Pruebas']} rows={orders.map((order) => [fallback(order.orderCode), `${fallback(order.patientName)} (${fallback(order.patientCode)})`, humanize(order.status), order.testCount ?? 0])} empty="No hay ordenes de laboratorio." /></section></section>
  </>
}

function PharmacyContent({ data, query }: { data: PharmacyOverview; query: string }) {
  const medications = asArray(data.medications).filter((item) => matchesQuery(query, item.code, item.genericName, item.commercialName, item.presentation))
  const prescriptions = asArray(data.prescriptions).filter((item) => matchesQuery(query, item.prescriptionCode, item.patientCode, item.patientName, item.status))

  return <>
    <SummaryCards items={[{ label: 'Medicamentos', value: data.summary?.medicationCount ?? 0 }, { label: 'Activos', value: data.summary?.activeMedicationCount ?? 0 }, { label: 'Stock bajo', value: data.summary?.lowStockCount ?? 0 }, { label: 'Recetas', value: prescriptions.length }]} />
    <section className="operation-grid"><section className="panel operation-panel operation-panel-wide"><PanelTitle title="Existencias de farmacia" meta="Origen: medication e inventory_stock" /><DataTable headers={['Codigo', 'Medicamento', 'Presentacion', 'Disponible', 'Minimo', 'Proximo vencimiento']} rows={medications.map((medication) => [fallback(medication.code), fallback(medication.genericName), `${fallback(medication.presentation)}${medication.concentration ? ` · ${medication.concentration}` : ''}`, medication.availableQuantity ?? 0, medication.minimumStock ?? 0, medication.nextExpiry ?? 'Sin lote'])} empty="No hay medicamentos registrados." /></section><section className="panel operation-panel"><PanelTitle title="Recetas recientes" meta="Origen: prescription" /><DataTable headers={['Receta', 'Paciente', 'Estado']} rows={prescriptions.map((prescription) => [fallback(prescription.prescriptionCode), fallback(prescription.patientName), humanize(prescription.status)])} empty="No hay recetas registradas." /></section></section>
  </>
}

function InventoryContent({ data, query }: { data: InventoryOverview; query: string }) {
  const stock = asArray(data.stock).filter((item) => matchesQuery(query, item.medicationCode, item.genericName, item.batchCode, item.locationName))
  const movements = asArray(data.movements).filter((item) => matchesQuery(query, item.movementCode, item.genericName, item.movementType, item.reason))

  return <>
    <SummaryCards items={[{ label: 'Lineas de stock', value: data.summary?.stockLines ?? 0 }, { label: 'Unidades disponibles', value: data.summary?.totalUnits ?? 0 }, { label: 'Stock bajo', value: data.summary?.lowStockLines ?? 0 }, { label: 'Vencen pronto', value: data.summary?.expiringSoonLines ?? 0 }]} />
    <section className="operation-grid"><section className="panel operation-panel operation-panel-wide"><PanelTitle title="Stock por lote y ubicacion" meta="Origen: inventory_stock" /><DataTable headers={['Medicamento', 'Lote', 'Ubicacion', 'Disponible', 'Vence']} rows={stock.map((item) => [fallback(item.genericName), fallback(item.batchCode), fallback(item.locationName), item.availableQuantity ?? 0, fallback(item.expiresOn)])} empty="No hay existencias registradas." /></section><section className="panel operation-panel"><PanelTitle title="Movimientos recientes" meta="Origen: stock_movement" /><DataTable headers={['Codigo', 'Tipo', 'Medicamento', 'Cantidad']} rows={movements.map((movement) => [fallback(movement.movementCode), humanize(movement.movementType), fallback(movement.genericName), movement.quantity ?? 0])} empty="No hay movimientos registrados." /></section></section>
  </>
}

function BillingContent({ data, query }: { data: BillingOverview; query: string }) {
  const invoices = asArray(data.invoices).filter((item) => matchesQuery(query, item.invoiceCode, item.patientCode, item.patientName, item.status))
  const payments = asArray(data.payments).filter((item) => matchesQuery(query, item.paymentCode, item.invoiceCode, item.paymentMethod, item.status))

  return <>
    <SummaryCards items={[{ label: 'Cargos', value: data.summary?.chargeCount ?? 0 }, { label: 'Cargos pendientes', value: data.summary?.pendingChargeCount ?? 0 }, { label: 'Monto pendiente', value: formatMoney(data.summary?.pendingAmount ?? 0) }, { label: 'Facturas', value: invoices.length }]} />
    <section className="operation-grid"><section className="panel operation-panel operation-panel-wide"><PanelTitle title="Facturas recientes" meta="Origen: invoice" /><DataTable headers={['Factura', 'Paciente', 'Estado', 'Total']} rows={invoices.map((invoice) => [fallback(invoice.invoiceCode), fallback(invoice.patientName), humanize(invoice.status), `${fallback(invoice.currency, 'Bs')} ${formatNumber(invoice.total)}`])} empty="No hay facturas registradas." /></section><section className="panel operation-panel"><PanelTitle title="Pagos recientes" meta="Origen: payment" /><DataTable headers={['Pago', 'Factura', 'Metodo', 'Monto']} rows={payments.map((payment) => [fallback(payment.paymentCode), fallback(payment.invoiceCode), humanize(payment.paymentMethod), formatMoney(payment.amount)])} empty="No hay pagos registrados." /></section></section>
  </>
}

function ReportsContent({ data, query }: { data: ReportsOverview; query: string }) {
  const appointmentsByStatus = asArray(data.appointmentsByStatus).filter((item) => matchesQuery(query, item.status))
  const appointmentsBySpecialty = asArray(data.appointmentsBySpecialty).filter((item) => matchesQuery(query, item.specialty))

  return <>
    <SummaryCards items={[{ label: 'Pacientes activos', value: data.summary?.activePatients ?? 0 }, { label: 'Citas activas', value: data.summary?.activeAppointments ?? 0 }, { label: 'Consultas', value: data.summary?.consultations ?? 0 }, { label: 'Unidades en inventario', value: data.summary?.inventoryUnits ?? 0 }]} />
    <section className="operation-grid"><section className="panel operation-panel"><PanelTitle title="Citas por estado" meta="Consulta agregada" /><DataTable headers={['Estado', 'Cantidad']} rows={appointmentsByStatus.map((item) => [humanize(item.status), item.count ?? 0])} empty="No hay citas para reportar." /></section><section className="panel operation-panel"><PanelTitle title="Demanda por especialidad" meta="Consulta agregada" /><DataTable headers={['Especialidad', 'Citas']} rows={appointmentsBySpecialty.map((item) => [fallback(item.specialty), item.count ?? 0])} empty="No hay especialidades para reportar." /></section></section>
  </>
}

function AdministrationContent({ data, query }: { data: AdministrationOverview; query: string }) {
  const users = asArray(data.users).filter((item) => matchesQuery(query, item.username, item.displayName, item.email, item.status, item.roles))
  const audit = asArray(data.audit).filter((item) => matchesQuery(query, item.action, item.entityType, item.username))

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

function matchesQuery(query: string, ...values: Array<string | number | null | undefined>) {
  const normalized = query.trim().toLocaleLowerCase('es')
  if (!normalized) return true
  return values.some((value) => String(value ?? '').toLocaleLowerCase('es').includes(normalized))
}

function downloadOverview(module: OperationalModule, data: Overview) {
  const table = exportTable(module, data)
  const csv = [table.headers, ...table.rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `siih-${module}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function exportTable(module: OperationalModule, data: Overview): { headers: string[]; rows: Array<Array<string | number>> } {
  if (module === 'laboratorio') {
    const overview = data as LaboratoryOverview
    return { headers: ['Orden', 'Paciente', 'Código paciente', 'Estado', 'Pruebas', 'Solicitada'], rows: asArray(overview.orders).map((item) => [fallback(item.orderCode), fallback(item.patientName), fallback(item.patientCode), humanize(item.status), item.testCount ?? 0, fallback(item.requestedAt)]) }
  }
  if (module === 'farmacia') {
    const overview = data as PharmacyOverview
    return { headers: ['Código', 'Medicamento', 'Presentación', 'Disponible', 'Mínimo', 'Vencimiento'], rows: asArray(overview.medications).map((item) => [fallback(item.code), fallback(item.genericName), fallback(item.presentation), item.availableQuantity ?? 0, item.minimumStock ?? 0, fallback(item.nextExpiry, 'Sin lote')]) }
  }
  if (module === 'inventario') {
    const overview = data as InventoryOverview
    return { headers: ['Medicamento', 'Lote', 'Ubicación', 'Disponible', 'Reservado', 'Vencimiento'], rows: asArray(overview.stock).map((item) => [fallback(item.genericName), fallback(item.batchCode), fallback(item.locationName), item.availableQuantity ?? 0, item.reservedQuantity ?? 0, fallback(item.expiresOn)]) }
  }
  if (module === 'facturacion') {
    const overview = data as BillingOverview
    return { headers: ['Factura', 'Paciente', 'Código paciente', 'Estado', 'Moneda', 'Total'], rows: asArray(overview.invoices).map((item) => [fallback(item.invoiceCode), fallback(item.patientName), fallback(item.patientCode), humanize(item.status), fallback(item.currency), item.total ?? 0]) }
  }
  if (module === 'reportes') {
    const overview = data as ReportsOverview
    return { headers: ['Especialidad', 'Citas'], rows: asArray(overview.appointmentsBySpecialty).map((item) => [fallback(item.specialty), item.count ?? 0]) }
  }
  const overview = data as AdministrationOverview
  return { headers: ['Usuario', 'Nombre', 'Correo', 'Roles', 'Estado'], rows: asArray(overview.users).map((item) => [fallback(item.username), fallback(item.displayName), fallback(item.email), fallback(item.roles, 'Sin rol'), humanize(item.status)]) }
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
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
