import { ArrowLeft, CircleHelp, Eye, EyeOff, HeartPulse, KeyRound, LockKeyhole, ShieldCheck, UserRound, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import heroImage from '../assets/siih-hero.png'
import { useAuth } from '../auth/auth-context'
import { demoPassword, demoProfiles } from '../auth/demoAccounts'
import './PublicPages.css'

type AccessMode = 'institutional' | 'demo'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<AccessMode>('institutional')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showAccessHelp, setShowAccessHelp] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/app/inicio" replace />

  const changeMode = (nextMode: AccessMode) => {
    setMode(nextMode)
    setError('')
    if (nextMode === 'demo') {
      setUsername(demoProfiles[0]?.username ?? '')
      setPassword(demoPassword)
    } else {
      setUsername('')
      setPassword('')
    }
  }

  const selectDemoProfile = (profileUsername: string) => {
    setUsername(profileUsername)
    setPassword(demoPassword)
    setError('')
  }

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
          <span><strong>SIIH</strong><small>Hospital Universitario San Andrés</small></span>
        </Link>
        <div className="login-visual-copy">
          <span className="landing-kicker">Atención conectada</span>
          <h1>La información clínica y operativa, donde se necesita.</h1>
          <p>Acceso controlado para admisión, atención clínica, laboratorio, farmacia, caja y dirección.</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <Link className="login-back" to="/"><ArrowLeft aria-hidden="true" /> Volver al inicio</Link>
          <div className="login-heading">
            <span className="login-security"><ShieldCheck aria-hidden="true" /> Acceso institucional protegido</span>
            <h2>Ingresar al SIIH</h2>
            <p>Identifícate con la cuenta asignada por el hospital.</p>
          </div>

          <div className="login-mode" role="tablist" aria-label="Tipo de acceso">
            <button type="button" role="tab" aria-selected={mode === 'institutional'} className={mode === 'institutional' ? 'selected' : ''} onClick={() => changeMode('institutional')}>Cuenta institucional</button>
            <button type="button" role="tab" aria-selected={mode === 'demo'} className={mode === 'demo' ? 'selected' : ''} onClick={() => changeMode('demo')}>Entorno de prueba</button>
          </div>

          <form className="login-form" onSubmit={(event) => void submit(event)}>
            {mode === 'demo' && <div className="login-field demo-profile-field">
              <label htmlFor="demo-profile">Perfil de demostración</label>
              <select id="demo-profile" value={username} onChange={(event) => selectDemoProfile(event.target.value)}>
                {demoProfiles.map((profile) => <option value={profile.username} key={profile.username}>{profile.displayName} · {profile.username}</option>)}
              </select>
            </div>}
            <div className="login-field">
              <label htmlFor="login-username">Usuario</label>
              <span className="login-input"><UserRound aria-hidden="true" /><input id="login-username" autoComplete="username" required value={username} onChange={(event) => { setUsername(event.target.value); setError('') }} placeholder={mode === 'demo' ? undefined : 'nombre.apellido'} /></span>
            </div>
            <div className="login-field">
              <label htmlFor="login-password">Contraseña</label>
              <span className="login-input"><LockKeyhole aria-hidden="true" /><input id="login-password" autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))} onBlur={() => setCapsLock(false)} /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></span>
              {capsLock && <small className="caps-lock-warning">Bloq Mayús está activado.</small>}
            </div>
            <div className="login-options">
              <label className="remember-field"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Mantener la sesión en este equipo</span></label>
              <button type="button" className="access-help-link" onClick={() => setShowAccessHelp(true)}>Solicitar cuenta o recuperar acceso</button>
            </div>
            {error && <div className="login-error" role="alert"><strong>No se pudo iniciar sesión.</strong><span>{error}</span></div>}
            <button className="login-submit" type="submit" disabled={submitting}>{submitting ? 'Verificando acceso...' : 'Ingresar al sistema'}</button>
          </form>

          {mode === 'demo' && <div className="demo-note"><KeyRound aria-hidden="true" /><span><strong>Entorno académico:</strong> los perfiles usan la clave <code>{demoPassword}</code> y datos sintéticos.</span></div>}
          <p className="login-legal">El acceso y los cambios sensibles quedan sujetos a permisos y auditoría. No utilices datos reales de pacientes en este entorno académico.</p>
        </div>
      </section>
    </main>
    {showAccessHelp && <AccessHelpDialog onClose={() => setShowAccessHelp(false)} />}
  </>
}

function AccessHelpDialog({ onClose }: { onClose: () => void }) {
  return <div className="access-help-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="access-help-dialog" role="dialog" aria-modal="true" aria-labelledby="access-help-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><span><CircleHelp aria-hidden="true" /></span><div><small>Identidad y acceso</small><h2 id="access-help-title">Cuenta institucional</h2></div><button type="button" title="Cerrar" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></button></header>
      <div className="access-help-content">
        <div><UserRound aria-hidden="true" /><span><strong>Necesito una cuenta nueva</strong><p>Las cuentas no son de registro público. El responsable de tu área debe solicitar el alta a un administrador del SIIH para que TI verifique tu identidad y asigne el rol mínimo necesario.</p></span></div>
        <div><KeyRound aria-hidden="true" /><span><strong>Olvidé mi contraseña o mi cuenta se bloqueó</strong><p>Solicita a TI el restablecimiento institucional. La política de recuperación de autoservicio todavía no está habilitada en este entorno.</p></span></div>
      </div>
      <footer><button type="button" className="login-submit" onClick={onClose}>Entendido</button></footer>
    </section>
  </div>
}
