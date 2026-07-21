import { ArrowLeft, Eye, EyeOff, HeartPulse, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import heroImage from '../assets/siih-hero.png'
import { useAuth } from '../auth/auth-context'
import { demoPassword, demoProfiles } from '../auth/demoAccounts'
import './PublicPages.css'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('recepcion')
  const [password, setPassword] = useState(demoPassword)
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
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

  return (
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
            <span className="login-security"><ShieldCheck aria-hidden="true" /> Entorno académico protegido</span>
            <h2>Ingresar al SIIH</h2>
            <p>Utiliza tu cuenta institucional para continuar.</p>
          </div>

          <form className="login-form" onSubmit={(event) => void submit(event)}>
            <label>
              Perfil de demostración
              <select value={username} onChange={(event) => setUsername(event.target.value)}>
                {demoProfiles.map((profile) => <option value={profile.username} key={profile.username}>{profile.displayName} · {profile.username}</option>)}
              </select>
            </label>
            <label>
              Usuario
              <span className="login-input"><UserRound aria-hidden="true" /><input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></span>
            </label>
            <label>
              Contraseña
              <span className="login-input"><LockKeyhole aria-hidden="true" /><input autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></span>
            </label>
            <label className="remember-field"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Recordar sesión en este equipo</span></label>
            {error && <div className="login-error" role="alert">{error}</div>}
            <button className="login-submit" type="submit" disabled={submitting}>{submitting ? 'Verificando acceso...' : 'Ingresar al sistema'}</button>
          </form>

          <div className="demo-note"><strong>Clave del entorno:</strong> <code>{demoPassword}</code></div>
          <p className="login-legal">No utilices datos reales de pacientes en este entorno académico.</p>
        </div>
      </section>
    </main>
  )
}
