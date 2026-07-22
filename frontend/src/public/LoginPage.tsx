import { ArrowLeft, CircleHelp, Eye, EyeOff, HeartPulse, LockKeyhole, ShieldCheck, UserRound, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { RegisterRequest } from '../api'
import heroImage from '../assets/siih-hero.png'
import { useAuth } from '../auth/auth-context'
import './PublicPages.css'

export function LoginPage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showAccessHelp, setShowAccessHelp] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/app/inicio" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const result = await login(username, password, remember)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    const destination = (location.state as { from?: string } | null)?.from ?? '/app/inicio'
    navigate(destination, { replace: true })
  }

  return <>
    <main className="login-page">
      <section className="login-visual" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="login-visual-shade" aria-hidden="true" />
        <Link className="public-brand login-brand" to="/">
          <span className="public-brand-mark"><HeartPulse aria-hidden="true" /></span>
          <span><strong>SIIH</strong><small>Hospital Universitario San Andres</small></span>
        </Link>
        <div className="login-visual-copy">
          <span className="landing-kicker">Atencion conectada</span>
          <h1>La informacion clinica y operativa, donde se necesita.</h1>
          <p>Acceso controlado para admision, atencion clinica, laboratorio, farmacia, caja y direccion.</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <Link className="login-back" to="/"><ArrowLeft aria-hidden="true" /> Volver al inicio</Link>
          <div className="login-heading">
            <span className="login-security"><ShieldCheck aria-hidden="true" /> Acceso institucional protegido</span>
            <h2>Ingresar al SIIH</h2>
            <p>Identificate con la cuenta asignada por el hospital.</p>
          </div>


          <form className="login-form" onSubmit={(event) => void submit(event)}>
            <div className="login-field">
              <label htmlFor="login-username">Usuario</label>
              <span className="login-input"><UserRound aria-hidden="true" /><input id="login-username" autoComplete="username" required value={username} onChange={(event) => { setUsername(event.target.value); setError('') }} placeholder="nombre.apellido" /></span>
            </div>
            <div className="login-field">
              <label htmlFor="login-password">Contrasena</label>
              <span className="login-input"><LockKeyhole aria-hidden="true" /><input id="login-password" autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))} onBlur={() => setCapsLock(false)} /><button type="button" aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'} title={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></span>
              {capsLock && <small className="caps-lock-warning">Bloq Mayus esta activado.</small>}
            </div>
            <div className="login-options">
              <label className="remember-field"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Mantener la sesion en este equipo</span></label>
              <button type="button" className="access-help-link" onClick={() => setShowAccessHelp(true)}>Crear cuenta academica</button>
            </div>
            {error && <div className="login-error" role="alert"><strong>No se pudo iniciar sesion.</strong><span>{error}</span></div>}
            <button className="login-submit" type="submit" disabled={submitting}>{submitting ? 'Verificando acceso...' : 'Ingresar al sistema'}</button>
          </form>

          <p className="login-legal">El acceso y los cambios sensibles quedan sujetos a permisos y auditoria. No utilices datos reales de pacientes en este entorno academico.</p>
        </div>
      </section>
    </main>
    {showAccessHelp && <AccessHelpDialog onClose={() => setShowAccessHelp(false)} onRegister={async (payload) => {
      const result = await register(payload)
      if (result.ok) {
        setShowAccessHelp(false)
        navigate('/app/inicio', { replace: true })
      }
      return result
    }} />}
  </>
}

function AccessHelpDialog({ onClose, onRegister }: { onClose: () => void; onRegister: (payload: RegisterRequest) => Promise<{ ok: true } | { ok: false; message: string }> }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '', role: 'RECEPTION', licenseNumber: '', remember: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const needsLicense = ['DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST'].includes(form.role)
  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Las contrasenas no coinciden.')
      return
    }
    setSaving(true)
    const result = await onRegister({
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username,
      email: form.email || undefined,
      password: form.password,
      role: form.role,
      licenseNumber: needsLicense ? form.licenseNumber || undefined : undefined,
      remember: form.remember,
    })
    setSaving(false)
    if (!result.ok) setError(result.message)
  }
  return <div className="access-help-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="access-help-dialog" role="dialog" aria-modal="true" aria-labelledby="access-help-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><span><CircleHelp aria-hidden="true" /></span><div><small>Identidad y acceso</small><h2 id="access-help-title">Cuenta academica</h2></div><button type="button" title="Cerrar" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></button></header>
      <form className="access-register-form" onSubmit={(event) => void submit(event)}>
        <div className="access-help-content">
          <div><UserRound aria-hidden="true" /><span><strong>Crear cuenta academica</strong><p>Registra una cuenta local para probar los modulos del SIIH. El rol elegido define los permisos iniciales.</p></span></div>
        </div>
        <div className="access-register-grid">
          <label>Nombre<input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} /></label>
          <label>Apellido<input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} /></label>
          <label>Usuario<input required value={form.username} onChange={(event) => update('username', event.target.value)} placeholder="nombre.apellido" /></label>
          <label>Correo<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="usuario@hospital.local" /></label>
          <label>Rol<select value={form.role} onChange={(event) => update('role', event.target.value)}>
            <option value="RECEPTION">Admision y recepcion</option>
            <option value="DOCTOR">Personal medico</option>
            <option value="NURSE">Enfermeria</option>
            <option value="LAB_TECHNICIAN">Laboratorio clinico</option>
            <option value="PHARMACIST">Farmacia</option>
            <option value="CASHIER">Caja y facturacion</option>
            <option value="DIRECTOR">Direccion</option>
          </select></label>
          {needsLicense && <label>Matricula o codigo<input value={form.licenseNumber} onChange={(event) => update('licenseNumber', event.target.value)} placeholder="RM-ACA-001" /></label>}
          <label>Contrasena<input required type="password" minLength={8} value={form.password} onChange={(event) => update('password', event.target.value)} /></label>
          <label>Confirmar contrasena<input required type="password" minLength={8} value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} /></label>
          <label className="remember-field access-register-remember"><input type="checkbox" checked={form.remember} onChange={(event) => update('remember', event.target.checked)} /><span>Mantener la sesion en este equipo</span></label>
        </div>
        {error && <div className="login-error access-register-error" role="alert"><strong>No se pudo crear la cuenta.</strong><span>{error}</span></div>}
        <footer><button type="button" className="public-button public-button-ghost access-cancel" onClick={onClose}>Cancelar</button><button type="submit" className="login-submit" disabled={saving}>{saving ? 'Creando cuenta...' : 'Crear cuenta'}</button></footer>
      </form>
    </section>
  </div>
}
