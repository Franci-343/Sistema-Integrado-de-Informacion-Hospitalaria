import { ArrowRight, CalendarDays, ChartNoAxesCombined, Check, ClipboardPlus, FlaskConical, HeartPulse, LockKeyhole, PackageSearch, Pill, ReceiptText, ShieldCheck, Stethoscope, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/siih-hero.png'
import './PublicPages.css'

const modules = [
  { icon: Users, title: 'Admisión y pacientes', text: 'Ficha única, búsqueda de duplicados y trazabilidad demográfica.' },
  { icon: CalendarDays, title: 'Agenda hospitalaria', text: 'Citas, disponibilidad, llegada y continuidad de la atención.' },
  { icon: Stethoscope, title: 'Atención clínica', text: 'Historia longitudinal, consultas, triaje y hospitalización.' },
  { icon: FlaskConical, title: 'Laboratorio', text: 'Órdenes, muestras, resultados y publicación validada.' },
  { icon: Pill, title: 'Farmacia', text: 'Recetas vigentes, dispensación y control de existencias.' },
  { icon: PackageSearch, title: 'Inventario', text: 'Lotes, vencimientos, movimientos y alertas de stock.' },
  { icon: ReceiptText, title: 'Caja y facturación', text: 'Cargos, pagos y comprobantes vinculados al servicio.' },
  { icon: ChartNoAxesCombined, title: 'Dirección y control', text: 'Indicadores operativos, auditoría y gestión de accesos.' },
]

const outcomes = [
  'Una sola ficha por paciente',
  'Procesos clínicos conectados',
  'Información operativa oportuna',
  'Acceso por funciones y áreas',
]

export function LandingPage() {
  return (
    <div className="public-page">
      <header className="public-header">
        <Link className="public-brand" to="/" aria-label="SIIH, inicio">
          <span className="public-brand-mark"><HeartPulse aria-hidden="true" /></span>
          <span><strong>SIIH</strong><small>Hospital Universitario San Andrés</small></span>
        </Link>
        <nav aria-label="Navegación pública">
          <a href="#alcance">Áreas</a>
          <a href="#proposito">Propósito</a>
          <Link className="public-login-link" to="/acceso">Ingresar <ArrowRight aria-hidden="true" /></Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="landing-hero-shade" aria-hidden="true" />
          <div className="landing-hero-content">
            <span className="landing-kicker">Hospital Universitario San Andrés</span>
            <h1>Sistema Integrado de Información Hospitalaria</h1>
            <p>Una plataforma para conectar la atención clínica y la gestión hospitalaria con información segura, trazable y disponible para cada área.</p>
            <div className="landing-actions">
              <Link className="public-button public-button-primary" to="/acceso">Ingresar al sistema <ArrowRight aria-hidden="true" /></Link>
              <a className="public-button public-button-ghost" href="#alcance">Conocer el alcance</a>
            </div>
          </div>
          <div className="landing-signal" aria-label="Principios del sistema">
            <span><ShieldCheck aria-hidden="true" /> Acceso por roles</span>
            <span><ClipboardPlus aria-hidden="true" /> Historia continua</span>
            <span><ChartNoAxesCombined aria-hidden="true" /> Decisiones con datos</span>
          </div>
        </section>

        <section className="public-section module-section" id="alcance">
          <div className="public-section-heading">
            <span className="landing-kicker landing-kicker-dark">Alcance hospitalario</span>
            <h2>El recorrido completo de la atención, en un mismo sistema</h2>
            <p>El SIIH integra las áreas que hoy dependen de registros aislados, papel y doble digitación.</p>
          </div>
          <div className="module-grid">
            {modules.map(({ icon: ModuleIcon, title, text }) => (
              <article className="module-item" key={title}>
                <ModuleIcon aria-hidden="true" />
                <div><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="outcome-band" id="proposito">
          <div className="outcome-copy">
            <span className="landing-kicker">Propósito del SIIH</span>
            <h2>Menos fragmentación. Más continuidad para el paciente.</h2>
            <p>El proyecto centraliza los procesos clínicos y administrativos para reducir demoras, errores, reprocesos y decisiones basadas en información incompleta.</p>
          </div>
          <div className="outcome-list">
            {outcomes.map((outcome) => <span key={outcome}><Check aria-hidden="true" />{outcome}</span>)}
          </div>
        </section>

        <section className="public-section trust-section">
          <div className="trust-icon"><LockKeyhole aria-hidden="true" /></div>
          <div>
            <span className="landing-kicker landing-kicker-dark">Privacidad y trazabilidad</span>
            <h2>La información correcta, para la persona autorizada</h2>
            <p>El diseño contempla mínimo privilegio, separación de funciones, sesiones controladas y auditoría de las operaciones sensibles.</p>
          </div>
          <Link className="public-button public-button-dark" to="/acceso">Acceder al entorno <ArrowRight aria-hidden="true" /></Link>
        </section>
      </main>

      <footer className="public-footer">
        <div className="public-brand public-brand-footer"><span className="public-brand-mark"><HeartPulse aria-hidden="true" /></span><span><strong>SIIH</strong><small>Proyecto académico de integración hospitalaria</small></span></div>
        <span>Hospital Universitario San Andrés · La Paz, Bolivia</span>
      </footer>
    </div>
  )
}
