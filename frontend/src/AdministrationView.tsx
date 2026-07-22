import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LockOpen,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, type AdminUser, type AuditEvent, type ProfessionalRegistryItem, type Role, type Specialty } from './api'
import { useAuth } from './auth/auth-context'

type AdminTab = 'users' | 'professionals' | 'roles' | 'audit'
type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED'
type UserEditorValues = {
  username: string
  password?: string
  firstName: string
  lastName: string
  email?: string
  roleCodes: string[]
}
type ProfessionalEditorValues = {
  username: string
  password: string
  firstName: string
  lastName: string
  email?: string
  licenseNumber: string
  professionalType: string
  specialtyIds: string[]
}
type AuditFilters = {
  username: string
  action: string
  entityType: string
  origin: string
  result: '' | 'SUCCESS' | 'FAILURE'
  from: string
  to: string
}

const emptyAuditFilters: AuditFilters = {
  username: '',
  action: '',
  entityType: '',
  origin: '',
  result: '',
  from: '',
  to: '',
}

export function AdministrationView({ onNotify }: { onNotify: (message: string) => void }) {
  const { user: currentUser } = useAuth()
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [professionals, setProfessionals] = useState<ProfessionalRegistryItem[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [auditLoading, setAuditLoading] = useState(false)
  const [error, setError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userStatus, setUserStatus] = useState('')
  const [userPage, setUserPage] = useState(0)
  const [auditPage, setAuditPage] = useState(0)
  const [auditFilters, setAuditFilters] = useState<AuditFilters>(emptyAuditFilters)
  const [appliedAuditFilters, setAppliedAuditFilters] = useState<AuditFilters>(emptyAuditFilters)
  const [editor, setEditor] = useState<{ mode: 'create' } | { mode: 'edit'; account: AdminUser } | null>(null)
  const [professionalEditor, setProfessionalEditor] = useState(false)
  const [rolesAccount, setRolesAccount] = useState<AdminUser | null>(null)
  const [statusChange, setStatusChange] = useState<{ account: AdminUser; status: AccountStatus } | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [accounts, availableRoles, events, professionalList, specialtyList] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getAuditEvents(),
        api.getProfessionalRegistry(),
        api.getSpecialties(),
      ])
      setUsers(accounts)
      setRoles(availableRoles)
      setAudit(events)
      setProfessionals(professionalList)
      setSpecialties(specialtyList)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadAll() }, [loadAll])
  useEffect(() => { setUserPage(0) }, [userSearch, userStatus])
  useEffect(() => { setAuditPage(0) }, [appliedAuditFilters])

  const loadAudit = async (filters: AuditFilters) => {
    setAuditLoading(true)
    setError('')
    try {
      const events = await api.getAuditEvents({
        username: filters.username || undefined,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        from: filterTimestamp(filters.from, false),
        to: filterTimestamp(filters.to, true),
      })
      setAudit(events)
      setAppliedAuditFilters(filters)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setAuditLoading(false)
    }
  }

  const refreshAfterChange = async (message: string) => {
    const [accounts, events, professionalList] = await Promise.all([
      api.getUsers(),
      api.getAuditEvents({
        username: appliedAuditFilters.username || undefined,
        action: appliedAuditFilters.action || undefined,
        entityType: appliedAuditFilters.entityType || undefined,
        from: filterTimestamp(appliedAuditFilters.from, false),
        to: filterTimestamp(appliedAuditFilters.to, true),
      }),
      api.getProfessionalRegistry(),
    ])
    setUsers(accounts)
    setAudit(events)
    setProfessionals(professionalList)
    onNotify(message)
  }

  const roleNames = useMemo(() => new Map(roles.map((role) => [role.code, role.name])), [roles])
  const filteredUsers = useMemo(() => {
    const query = normalize(userSearch)
    return users.filter((account) => {
      const matchesStatus = !userStatus || account.status === userStatus
      const matchesSearch = !query || [account.username, account.displayName, account.email, ...account.roles]
        .some((value) => normalize(value).includes(query))
      return matchesStatus && matchesSearch
    })
  }, [userSearch, userStatus, users])

  const visibleAudit = useMemo(() => audit.filter((event) => {
    const matchesOrigin = !appliedAuditFilters.origin || normalize(event.origin).includes(normalize(appliedAuditFilters.origin))
    const matchesResult = !appliedAuditFilters.result
      || (appliedAuditFilters.result === 'SUCCESS' ? event.success : !event.success)
    return matchesOrigin && matchesResult
  }), [appliedAuditFilters, audit])

  const userPageSize = 12
  const userPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize))
  const visibleUsers = filteredUsers.slice(userPage * userPageSize, (userPage + 1) * userPageSize)
  const auditPageSize = 15
  const auditPages = Math.max(1, Math.ceil(visibleAudit.length / auditPageSize))
  const visibleAuditPage = visibleAudit.slice(auditPage * auditPageSize, (auditPage + 1) * auditPageSize)
  const actions = [...new Set(audit.map((event) => event.action))].sort()
  const entities = [...new Set(audit.map((event) => event.entityType))].sort()

  return <>
    <section className="page-heading compact-heading admin-heading">
      <div><span className="eyebrow">Seguridad e identidad</span><h1>Administración</h1><p>Gestiona cuentas institucionales, roles efectivos y eventos de auditoría.</p></div>
      <div className="heading-actions"><button type="button" className="button button-secondary" disabled={loading} onClick={() => void loadAll()}><RefreshCw aria-hidden="true" /> Actualizar</button><button type="button" className="button button-secondary" onClick={() => setProfessionalEditor(true)}><Stethoscope aria-hidden="true" /> Nuevo doctor</button><button type="button" className="button button-primary" onClick={() => setEditor({ mode: 'create' })}><UserPlus aria-hidden="true" /> Nuevo usuario</button></div>
    </section>

    {error && <section className="panel operation-error admin-error" role="alert"><strong>No se pudo completar la operación</strong><span>{error}</span><button type="button" className="button button-secondary" onClick={() => void loadAll()}>Reintentar</button></section>}

    <div className="operation-summary admin-summary" aria-label="Resumen de seguridad">
      <AdminMetric label="Usuarios registrados" value={users.length} icon={<Users />} />
      <AdminMetric label="Profesionales clínicos" value={professionals.filter((item) => item.status === 'ACTIVE').length} icon={<Stethoscope />} />
      <AdminMetric label="Cuentas activas" value={users.filter((account) => account.status === 'ACTIVE').length} icon={<UserCheck />} />
      <AdminMetric label="Bloqueadas o inactivas" value={users.filter((account) => account.status !== 'ACTIVE').length} icon={<LockKeyhole />} />
      <AdminMetric label="Eventos consultados" value={audit.length} icon={<ShieldCheck />} />
    </div>

    <section className="panel admin-console">
      <div className="admin-tabs" role="tablist" aria-label="Secciones de administración">
        <button type="button" role="tab" aria-selected={tab === 'users'} className={tab === 'users' ? 'selected' : ''} onClick={() => setTab('users')}>Usuarios</button>
        <button type="button" role="tab" aria-selected={tab === 'professionals'} className={tab === 'professionals' ? 'selected' : ''} onClick={() => setTab('professionals')}>Profesionales</button>
        <button type="button" role="tab" aria-selected={tab === 'roles'} className={tab === 'roles' ? 'selected' : ''} onClick={() => setTab('roles')}>Roles y permisos</button>
        <button type="button" role="tab" aria-selected={tab === 'audit'} className={tab === 'audit' ? 'selected' : ''} onClick={() => setTab('audit')}>Auditoría</button>
      </div>

      {tab === 'users' && <div role="tabpanel" className="admin-tab-panel">
        <div className="admin-toolbar">
          <label className="search-field admin-search"><Search aria-hidden="true" /><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar nombre, usuario, correo o rol" aria-label="Buscar usuarios" />{userSearch && <button type="button" title="Limpiar búsqueda" aria-label="Limpiar búsqueda" onClick={() => setUserSearch('')}><X aria-hidden="true" /></button>}</label>
          <label className="admin-select"><span>Estado</span><select value={userStatus} onChange={(event) => setUserStatus(event.target.value)}><option value="">Todos</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option><option value="LOCKED">Bloqueados</option></select></label>
          <span className="admin-result-count">{filteredUsers.length} {filteredUsers.length === 1 ? 'cuenta' : 'cuentas'}</span>
        </div>
        <div className="table-wrap admin-table"><table><thead><tr><th>Cuenta</th><th>Contacto</th><th>Roles efectivos</th><th>Último acceso</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>
          {loading ? <AdminEmpty columns={6} text="Cargando usuarios..." /> : visibleUsers.length === 0 ? <AdminEmpty columns={6} text="No hay cuentas que coincidan con los filtros." /> : visibleUsers.map((account) => <tr key={account.id}>
            <td><div className="admin-account"><span className="avatar avatar-soft">{initials(account.displayName)}</span><span><strong>{account.displayName}</strong><small>@{account.username}</small></span></div></td>
            <td><span className="admin-cell-main">{account.email || 'Sin correo institucional'}</span><small className="admin-cell-detail">Creada {formatDate(account.createdAt)}</small></td>
            <td><div className="role-tags">{account.roles.map((code) => <span key={code}>{roleNames.get(code) ?? code}</span>)}</div></td>
            <td><span className="admin-cell-main">{account.lastLoginAt ? formatDateTime(account.lastLoginAt) : 'Nunca ingresó'}</span>{account.failedLoginAttempts > 0 && <small className="admin-cell-detail warning-text">{account.failedLoginAttempts} intentos fallidos</small>}</td>
            <td><AccountStatusPill status={account.status} /></td>
            <td><div className="admin-row-actions"><button type="button" title="Editar cuenta" aria-label={`Editar cuenta de ${account.displayName}`} onClick={() => setEditor({ mode: 'edit', account })}><Pencil aria-hidden="true" /></button><button type="button" title="Asignar roles" aria-label={`Asignar roles a ${account.displayName}`} onClick={() => setRolesAccount(account)}><SlidersHorizontal aria-hidden="true" /></button>{account.id !== currentUser?.id && account.status === 'ACTIVE' && <><button type="button" title="Bloquear cuenta" aria-label={`Bloquear cuenta de ${account.displayName}`} onClick={() => setStatusChange({ account, status: 'LOCKED' })}><LockKeyhole aria-hidden="true" /></button><button type="button" title="Desactivar cuenta" aria-label={`Desactivar cuenta de ${account.displayName}`} onClick={() => setStatusChange({ account, status: 'INACTIVE' })}><UserX aria-hidden="true" /></button></>}{account.id !== currentUser?.id && account.status !== 'ACTIVE' && <button type="button" title="Activar cuenta" aria-label={`Activar cuenta de ${account.displayName}`} onClick={() => setStatusChange({ account, status: 'ACTIVE' })}><LockOpen aria-hidden="true" /></button>}</div></td>
          </tr>)}
        </tbody></table></div>
        <Pagination page={userPage} pages={userPages} total={filteredUsers.length} label="usuarios" onChange={setUserPage} />
      </div>}

      {tab === 'professionals' && <div role="tabpanel" className="admin-tab-panel">
        <div className="admin-section-heading"><div><h2>Profesionales habilitados</h2><p>Estos perfiles son los que aparecen como médicos disponibles al programar citas.</p></div><button type="button" className="button button-primary" onClick={() => setProfessionalEditor(true)}><Stethoscope aria-hidden="true" /> Crear doctor</button></div>
        <div className="table-wrap admin-table"><table><thead><tr><th>Profesional</th><th>Matrícula</th><th>Tipo</th><th>Especialidades</th><th>Estado</th></tr></thead><tbody>
          {loading ? <AdminEmpty columns={5} text="Cargando profesionales..." /> : professionals.length === 0 ? <AdminEmpty columns={5} text="No hay profesionales registrados." /> : professionals.map((professional) => <tr key={professional.id}>
            <td><div className="admin-account"><span className="avatar avatar-soft">{initials(professional.displayName)}</span><span><strong>{professional.displayName}</strong><small>@{professional.username} · {professional.professionalCode}</small></span></div></td>
            <td>{professional.licenseNumber || 'Sin matrícula'}</td>
            <td>{professionalTypeLabel(professional.professionalType)}</td>
            <td><div className="role-tags">{professional.specialties.length ? professional.specialties.map((specialty) => <span key={specialty}>{specialty}</span>) : <span>Sin especialidad</span>}</div></td>
            <td><AccountStatusPill status={professional.status} /></td>
          </tr>)}
        </tbody></table></div>
      </div>}

      {tab === 'roles' && <div role="tabpanel" className="admin-tab-panel">
        <div className="admin-section-heading"><div><h2>Roles disponibles</h2><p>La matriz muestra los permisos efectivos definidos por cada rol.</p></div><span>{roles.filter((role) => role.active).length} roles activos</span></div>
        <div className="table-wrap admin-table role-table"><table><thead><tr><th>Rol</th><th>Descripción</th><th>Estado</th><th>Permisos</th></tr></thead><tbody>{loading ? <AdminEmpty columns={4} text="Cargando roles..." /> : roles.map((role) => <tr key={role.id}><td><strong>{role.name}</strong><small className="admin-cell-detail">{role.code}</small></td><td>{role.description || 'Sin descripción'}</td><td><AccountStatusPill status={role.active ? 'ACTIVE' : 'INACTIVE'} /></td><td><details className="permission-details"><summary>{role.permissions.length} permisos</summary><div>{role.permissions.map((permission) => <span key={permission}>{permissionLabel(permission)}</span>)}</div></details></td></tr>)}</tbody></table></div>
      </div>}

      {tab === 'audit' && <div role="tabpanel" className="admin-tab-panel">
        <form className="audit-filters" onSubmit={(event) => { event.preventDefault(); void loadAudit(auditFilters) }}>
          <label>Usuario<input value={auditFilters.username} onChange={(event) => setAuditFilters({ ...auditFilters, username: event.target.value })} placeholder="Ej. admin" /></label>
          <label>Acción<select value={auditFilters.action} onChange={(event) => setAuditFilters({ ...auditFilters, action: event.target.value })}><option value="">Todas</option>{actions.map((action) => <option key={action} value={action}>{humanize(action)}</option>)}</select></label>
          <label>Entidad<select value={auditFilters.entityType} onChange={(event) => setAuditFilters({ ...auditFilters, entityType: event.target.value })}><option value="">Todas</option>{entities.map((entity) => <option key={entity} value={entity}>{humanize(entity)}</option>)}</select></label>
          <label>Origen<input value={auditFilters.origin} onChange={(event) => setAuditFilters({ ...auditFilters, origin: event.target.value })} placeholder="IP o cliente" /></label>
          <label>Resultado<select value={auditFilters.result} onChange={(event) => setAuditFilters({ ...auditFilters, result: event.target.value as AuditFilters['result'] })}><option value="">Todos</option><option value="SUCCESS">Correctos</option><option value="FAILURE">Fallidos</option></select></label>
          <label>Desde<input type="date" value={auditFilters.from} onChange={(event) => setAuditFilters({ ...auditFilters, from: event.target.value })} /></label>
          <label>Hasta<input type="date" min={auditFilters.from || undefined} value={auditFilters.to} onChange={(event) => setAuditFilters({ ...auditFilters, to: event.target.value })} /></label>
          <div className="audit-filter-actions"><button type="button" className="button button-secondary" onClick={() => { setAuditFilters(emptyAuditFilters); void loadAudit(emptyAuditFilters) }}>Limpiar</button><button type="submit" className="button button-primary" disabled={auditLoading}>{auditLoading ? 'Consultando...' : 'Aplicar filtros'}</button></div>
        </form>
        <div className="table-wrap admin-table audit-table"><table><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Origen</th><th>Resultado</th></tr></thead><tbody>{auditLoading ? <AdminEmpty columns={6} text="Consultando auditoría..." /> : visibleAuditPage.length === 0 ? <AdminEmpty columns={6} text="No hay eventos para los filtros seleccionados." /> : visibleAuditPage.map((event) => <tr key={event.id}><td>{formatDateTime(event.eventAt)}</td><td>{event.username || 'Sistema'}</td><td><strong>{humanize(event.action)}</strong></td><td><span className="admin-cell-main">{humanize(event.entityType)}</span>{event.entityId && <small className="admin-cell-detail entity-id">{event.entityId}</small>}</td><td>{event.origin || 'No registrado'}</td><td><span className={`audit-result ${event.success ? 'success' : 'failure'}`}>{event.success ? <CheckCircle2 aria-hidden="true" /> : <X aria-hidden="true" />}{event.success ? 'Correcto' : 'Fallido'}</span>{event.failureReason && <small className="admin-cell-detail warning-text">{event.failureReason}</small>}</td></tr>)}</tbody></table></div>
        <Pagination page={auditPage} pages={auditPages} total={visibleAudit.length} label="eventos" onChange={setAuditPage} />
      </div>}
    </section>

    {editor && <UserEditorModal mode={editor.mode} account={editor.mode === 'edit' ? editor.account : undefined} roles={roles} onClose={() => setEditor(null)} onSave={async (values) => {
      if (editor.mode === 'create') {
        await api.createUser({ username: values.username, password: values.password ?? '', firstName: values.firstName, lastName: values.lastName, email: values.email, roleCodes: values.roleCodes })
        setEditor(null)
        await refreshAfterChange('Cuenta institucional creada correctamente')
        return
      }
      await api.updateUser(editor.account.id, { firstName: values.firstName, lastName: values.lastName, email: values.email, newPassword: values.password })
      setEditor(null)
      await refreshAfterChange(values.password ? 'Cuenta actualizada y sesiones anteriores revocadas' : 'Datos de la cuenta actualizados')
    }} />}
    {professionalEditor && <ProfessionalEditorModal specialties={specialties} onClose={() => setProfessionalEditor(false)} onSave={async (values) => { await api.createProfessional(values); setProfessionalEditor(false); await refreshAfterChange('Doctor creado y habilitado en agenda') }} />}
    {rolesAccount && <RolesModal account={rolesAccount} roles={roles} onClose={() => setRolesAccount(null)} onSave={async (roleCodes) => { await api.updateUserRoles(rolesAccount.id, roleCodes); setRolesAccount(null); await refreshAfterChange('Roles actualizados y sesiones anteriores revocadas') }} />}
    {statusChange && <StatusConfirmModal change={statusChange} onClose={() => setStatusChange(null)} onConfirm={async () => { await api.updateUserStatus(statusChange.account.id, statusChange.status); setStatusChange(null); await refreshAfterChange(statusChange.status === 'ACTIVE' ? 'Cuenta activada correctamente' : statusChange.status === 'LOCKED' ? 'Cuenta bloqueada y sesiones revocadas' : 'Cuenta desactivada y sesiones revocadas') }} />}
  </>
}

function AdminMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="operation-stat operation-stat-icon"><span className="admin-metric-icon">{icon}</span><span>{label}</span><strong>{value}</strong></div>
}

function UserEditorModal({ mode, account, roles, onClose, onSave }: { mode: 'create' | 'edit'; account?: AdminUser; roles: Role[]; onClose: () => void; onSave: (values: UserEditorValues) => Promise<void> }) {
  const [form, setForm] = useState({ username: account?.username ?? '', firstName: account?.firstName ?? '', lastName: account?.lastName ?? '', email: account?.email ?? '', password: '', confirmation: '', roleCodes: account?.roles ?? [] })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const passwordRequired = mode === 'create'
  const passwordValid = (!form.password && !passwordRequired) || form.password.length >= 8
  const confirmationValid = (!form.password && !passwordRequired) || form.password === form.confirmation
  const canSave = Boolean(form.username.trim() && form.firstName.trim() && form.lastName.trim() && passwordValid && confirmationValid && (mode === 'edit' || form.roleCodes.length > 0))

  const generate = () => {
    const password = generatePassword()
    setForm((current) => ({ ...current, password, confirmation: password }))
    setShowPassword(true)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      await onSave({ username: form.username.trim(), password: form.password || undefined, firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() || undefined, roleCodes: form.roleCodes })
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setSaving(false)
    }
  }

  return <Modal title={mode === 'create' ? 'Crear cuenta institucional' : `Editar cuenta de ${account?.displayName}`} eyebrow={mode === 'create' ? 'Alta de usuario' : `@${account?.username}`} onClose={onClose} labelledBy="user-editor-title">
    <form onSubmit={(event) => void submit(event)}>
      <div className="form-grid admin-form-grid">
        <label>Nombre de usuario<input required disabled={mode === 'edit'} autoComplete="off" value={form.username} pattern="[a-z0-9._-]+" onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase().replace(/\s+/g, '') })} placeholder="nombre.apellido" /><small>Minúsculas, números, punto, guion o guion bajo.</small></label>
        <label>Correo institucional <span className="optional-label">Opcional</span><input type="email" autoComplete="off" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="usuario@hospital.bo" /></label>
        <label>Nombres<input required autoComplete="off" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
        <label>Apellidos<input required autoComplete="off" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
        <div className="admin-form-field form-span-two"><label htmlFor="account-password">{mode === 'create' ? 'Contraseña inicial' : 'Nueva contraseña'} <span className="optional-label">{mode === 'edit' ? 'Opcional' : 'Mínimo 8 caracteres'}</span></label><span className="admin-password-input"><KeyRound aria-hidden="true" /><input id="account-password" required={passwordRequired} type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button><button type="button" className="password-generate" onClick={generate}>Generar</button></span>{mode === 'edit' && <small>Al cambiarla se cerrarán las sesiones anteriores de esta cuenta.</small>}</div>
        <label className="form-span-two">Confirmar contraseña<input required={passwordRequired || Boolean(form.password)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmation} onChange={(event) => setForm({ ...form, confirmation: event.target.value })} />{!confirmationValid && <small className="field-error">Las contraseñas no coinciden.</small>}{!passwordValid && <small className="field-error">La contraseña debe tener al menos 8 caracteres.</small>}</label>
        {mode === 'create' && <fieldset className="choice-field form-span-two"><legend>Roles iniciales</legend><div className="check-grid admin-role-grid">{roles.filter((role) => role.active).map((role) => <label key={role.code}><input type="checkbox" checked={form.roleCodes.includes(role.code)} onChange={() => setForm((current) => ({ ...current, roleCodes: current.roleCodes.includes(role.code) ? current.roleCodes.filter((code) => code !== role.code) : [...current.roleCodes, role.code] }))} /><span><strong>{role.name}</strong><small>{role.description || `${role.permissions.length} permisos`}</small></span></label>)}</div></fieldset>}
      </div>
      {error && <p className="modal-error" role="alert">{error}</p>}
      <ModalFooter onClose={onClose} saving={saving} disabled={!canSave} label={mode === 'create' ? 'Crear cuenta' : 'Guardar cambios'} />
    </form>
  </Modal>
}

function ProfessionalEditorModal({ specialties, onClose, onSave }: { specialties: Specialty[]; onClose: () => void; onSave: (values: ProfessionalEditorValues) => Promise<void> }) {
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', password: '', confirmation: '', licenseNumber: '', professionalType: 'DOCTOR', specialtyIds: specialties[0] ? [specialties[0].id] : [] })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const passwordValid = form.password.length >= 8
  const confirmationValid = form.password === form.confirmation
  const canSave = Boolean(form.username.trim() && form.firstName.trim() && form.lastName.trim() && form.licenseNumber.trim() && passwordValid && confirmationValid && form.specialtyIds.length > 0)

  const generate = () => {
    const password = generatePassword()
    setForm((current) => ({ ...current, password, confirmation: password }))
    setShowPassword(true)
  }

  const toggleSpecialty = (id: string) => {
    setForm((current) => ({ ...current, specialtyIds: current.specialtyIds.includes(id) ? current.specialtyIds.filter((item) => item !== id) : [...current.specialtyIds, id] }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      await onSave({
        username: form.username.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        licenseNumber: form.licenseNumber.trim(),
        professionalType: form.professionalType,
        specialtyIds: form.specialtyIds,
      })
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setSaving(false)
    }
  }

  return <Modal title="Crear doctor" eyebrow="Cuenta y perfil profesional" onClose={onClose} labelledBy="professional-editor-title">
    <form onSubmit={(event) => void submit(event)}>
      <div className="form-grid admin-form-grid">
        <label>Nombre de usuario<input required autoComplete="off" value={form.username} pattern="[a-z0-9._-]+" onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase().replace(/\s+/g, '') })} placeholder="nombre.apellido" /></label>
        <label>Correo institucional <span className="optional-label">Opcional</span><input type="email" autoComplete="off" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="doctor@hospital.bo" /></label>
        <label>Nombres<input required autoComplete="off" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
        <label>Apellidos<input required autoComplete="off" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
        <label>Matrícula profesional<input required autoComplete="off" value={form.licenseNumber} onChange={(event) => setForm({ ...form, licenseNumber: event.target.value.toUpperCase() })} placeholder="RM-000-UMSA" /></label>
        <label>Tipo profesional<select value={form.professionalType} onChange={(event) => setForm({ ...form, professionalType: event.target.value })}><option value="DOCTOR">Doctor</option><option value="NURSE">Enfermería</option><option value="LAB_TECHNICIAN">Laboratorio</option><option value="PHARMACIST">Farmacia</option><option value="OTHER">Otro</option></select></label>
        <div className="admin-form-field form-span-two"><label htmlFor="professional-password">Contraseña inicial <span className="optional-label">Mínimo 8 caracteres</span></label><span className="admin-password-input"><KeyRound aria-hidden="true" /><input id="professional-password" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button><button type="button" className="password-generate" onClick={generate}>Generar</button></span></div>
        <label className="form-span-two">Confirmar contraseña<input required type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmation} onChange={(event) => setForm({ ...form, confirmation: event.target.value })} />{!confirmationValid && <small className="field-error">Las contraseñas no coinciden.</small>}{!passwordValid && <small className="field-error">La contraseña debe tener al menos 8 caracteres.</small>}</label>
        <fieldset className="choice-field form-span-two"><legend>Especialidades para agenda</legend><div className="check-grid admin-role-grid">{specialties.map((specialty) => <label key={specialty.id}><input type="checkbox" checked={form.specialtyIds.includes(specialty.id)} onChange={() => toggleSpecialty(specialty.id)} /><span><strong>{specialty.name}</strong><small>{specialty.description || specialty.code}</small></span></label>)}</div></fieldset>
      </div>
      {specialties.length === 0 && <p className="modal-error" role="alert">No hay especialidades activas. Registra datos maestros antes de crear profesionales.</p>}
      {error && <p className="modal-error" role="alert">{error}</p>}
      <ModalFooter onClose={onClose} saving={saving} disabled={!canSave} label="Crear doctor" />
    </form>
  </Modal>
}

function RolesModal({ account, roles, onClose, onSave }: { account: AdminUser; roles: Role[]; onClose: () => void; onSave: (codes: string[]) => Promise<void> }) {
  const [selected, setSelected] = useState(account.roles)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try { await onSave(selected) } catch (reason) { setError(errorMessage(reason)) } finally { setSaving(false) }
  }
  return <Modal title={`Roles de ${account.displayName}`} eyebrow={`@${account.username}`} onClose={onClose} labelledBy="roles-editor-title"><form onSubmit={(event) => void submit(event)}><div className="form-grid single-column"><fieldset className="choice-field"><legend>Roles efectivos</legend><div className="check-grid admin-role-grid">{roles.filter((role) => role.active).map((role) => <label key={role.code}><input type="checkbox" checked={selected.includes(role.code)} onChange={() => setSelected((current) => current.includes(role.code) ? current.filter((code) => code !== role.code) : [...current, role.code])} /><span><strong>{role.name}</strong><small>{role.description || `${role.permissions.length} permisos`}</small></span></label>)}</div></fieldset><p className="form-notice"><ShieldCheck aria-hidden="true" /> El cambio revocará las sesiones anteriores para aplicar los permisos nuevos.</p></div>{error && <p className="modal-error" role="alert">{error}</p>}<ModalFooter onClose={onClose} saving={saving} disabled={selected.length === 0} label="Guardar roles" /></form></Modal>
}

function StatusConfirmModal({ change, onClose, onConfirm }: { change: { account: AdminUser; status: AccountStatus }; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const action = change.status === 'ACTIVE' ? 'activar' : change.status === 'LOCKED' ? 'bloquear' : 'desactivar'
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try { await onConfirm() } catch (reason) { setError(errorMessage(reason)); setSaving(false) }
  }
  return <Modal title={`${capitalize(action)} cuenta`} eyebrow="Confirmación de seguridad" onClose={onClose} labelledBy="status-confirm-title"><form onSubmit={(event) => void submit(event)}><div className="confirm-account"><span className="avatar avatar-soft">{initials(change.account.displayName)}</span><span><strong>{change.account.displayName}</strong><small>@{change.account.username}</small></span></div><p className="confirm-copy">¿Confirmas que deseas {action} esta cuenta?{change.status !== 'ACTIVE' && ' Las sesiones abiertas serán revocadas inmediatamente.'}</p>{error && <p className="modal-error" role="alert">{error}</p>}<ModalFooter onClose={onClose} saving={saving} disabled={false} label={`${capitalize(action)} cuenta`} danger={change.status !== 'ACTIVE'} /></form></Modal>
}

function Modal({ title, eyebrow, labelledBy, onClose, children }: { title: string; eyebrow: string; labelledBy: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal operational-modal admin-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">{eyebrow}</span><h2 id={labelledBy}>{title}</h2></div><button type="button" className="close-button" title="Cerrar" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></button></div>{children}</div></div>
}

function ModalFooter({ onClose, saving, disabled, label, danger = false }: { onClose: () => void; saving: boolean; disabled: boolean; label: string; danger?: boolean }) {
  return <div className="modal-footer"><button type="button" className="button button-secondary" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" className={danger ? 'button button-danger' : 'button button-primary'} disabled={disabled || saving}>{saving ? 'Guardando...' : label}</button></div>
}

function Pagination({ page, pages, total, label, onChange }: { page: number; pages: number; total: number; label: string; onChange: (page: number) => void }) {
  return <div className="panel-footer admin-pagination"><span>{total} {label}</span><div className="pagination"><button type="button" aria-label="Página anterior" disabled={page === 0} onClick={() => onChange(page - 1)}>←</button><span>{page + 1} / {pages}</span><button type="button" aria-label="Página siguiente" disabled={page >= pages - 1} onClick={() => onChange(page + 1)}>→</button></div></div>
}

function AdminEmpty({ columns, text }: { columns: number; text: string }) {
  return <tr><td colSpan={columns}><div className="empty-state"><strong>{text}</strong></div></td></tr>
}

function AccountStatusPill({ status }: { status: string }) {
  const tone = status === 'ACTIVE' ? 'green' : status === 'LOCKED' ? 'amber' : 'blue'
  return <span className={`status-pill status-${tone}`}><i />{statusLabel(status)}</span>
}

function filterTimestamp(value: string, endOfDay: boolean) {
  if (!value) return undefined
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`)
  return date.toISOString()
}

function generatePassword() {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%*-_']
  const values = new Uint32Array(14)
  crypto.getRandomValues(values)
  const characters = groups.map((group, index) => group[values[index] % group.length])
  const alphabet = groups.join('')
  for (let index = groups.length; index < values.length; index += 1) characters.push(alphabet[values[index] % alphabet.length])
  return characters.map((character, index) => ({ character, order: values[index] })).sort((left, right) => left.order - right.order).map(({ character }) => character).join('')
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function normalize(value: string | null | undefined) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim()
}

function statusLabel(status: string) {
  return ({ ACTIVE: 'Activa', INACTIVE: 'Inactiva', LOCKED: 'Bloqueada' } as Record<string, string>)[status] ?? humanize(status)
}

function professionalTypeLabel(value: string) {
  return ({ DOCTOR: 'Doctor', NURSE: 'Enfermería', LAB_TECHNICIAN: 'Laboratorio', PHARMACIST: 'Farmacia', OTHER: 'Otro' } as Record<string, string>)[value] ?? humanize(value)
}

function permissionLabel(permission: string) {
  const area = permission.split('_')[0]
  const action = permission.endsWith('_WRITE') ? 'gestionar' : permission.endsWith('_READ') || permission.endsWith('_VIEW') ? 'consultar' : permission.endsWith('_EXPORT') ? 'exportar' : 'acceder'
  const areaLabels: Record<string, string> = { DASHBOARD: 'inicio', PATIENT: 'pacientes', APPOINTMENT: 'citas', CLINICAL: 'historia clínica', TRIAGE: 'triaje', HOSPITALIZATION: 'hospitalización', LAB: 'laboratorio', PHARMACY: 'farmacia', INVENTORY: 'inventario', BILLING: 'facturación', REPORT: 'reportes', ADMIN: 'administración', AUDIT: 'auditoría' }
  return `${capitalize(action)} ${areaLabels[area] ?? area.toLowerCase()}`
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Ocurrió un error al comunicarse con el backend.'
}
