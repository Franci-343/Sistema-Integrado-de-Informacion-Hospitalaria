import { expect, test, type Page, type Route } from '@playwright/test'

const allPermissions = [
  'DASHBOARD_VIEW', 'PATIENT_READ', 'PATIENT_WRITE', 'APPOINTMENT_READ', 'APPOINTMENT_WRITE',
  'CLINICAL_READ', 'CLINICAL_WRITE', 'TRIAGE_READ', 'TRIAGE_WRITE', 'HOSPITALIZATION_READ',
  'HOSPITALIZATION_WRITE', 'LAB_READ', 'LAB_WRITE', 'PHARMACY_READ', 'PHARMACY_WRITE',
  'INVENTORY_READ', 'INVENTORY_WRITE', 'BILLING_READ', 'BILLING_WRITE', 'REPORT_READ',
  'REPORT_EXPORT', 'ADMIN_READ', 'ADMIN_WRITE', 'AUDIT_READ',
]

const receptionPermissions = [
  'DASHBOARD_VIEW', 'PATIENT_READ', 'PATIENT_WRITE', 'APPOINTMENT_READ', 'APPOINTMENT_WRITE',
  'CLINICAL_READ', 'TRIAGE_READ', 'REPORT_READ',
]

test('presenta la landing y dirige al acceso', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sistema Integrado de Información Hospitalaria' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ingresar al sistema/ })).toBeVisible()
  await expect(page.locator('.landing-hero')).toHaveCSS('background-image', /siih-hero/)
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.locator('body').evaluate((element) => element.clientWidth))
})

test('protege el workspace, autentica por API y aplica el rol recepción', async ({ page }) => {
  const requests: string[] = []
  await installApiMock(page, requests)
  await page.goto('/app/inicio')
  await expect(page).toHaveURL(/\/acceso$/)

  await page.getByRole('tab', { name: 'Entorno de prueba' }).click()
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click()
  await expect(page).toHaveURL(/\/app\/inicio$/)
  await expect(page.getByText('Andrea Suárez', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Pacientes/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Agenda y citas/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Laboratorio/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Administración/ })).toHaveCount(0)
  expect(requests).toContain('/api/v1/auth/login')
})

test('muestra módulos funcionales al administrador sin errores de navegación', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await installApiMock(page)
  await page.goto('/acceso')
  await page.getByRole('tab', { name: 'Entorno de prueba' }).click()
  await page.getByLabel('Perfil de demostración').selectOption('admin')
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click()

  await expect(page.getByText('Camila Torres', { exact: true })).toBeVisible()
  const modules = ['Triaje', 'Hospitalización', 'Laboratorio', 'Farmacia', 'Inventario', 'Facturación', 'Reportes', 'Administración']
  for (const module of modules) {
    await page.getByRole('button', { name: module, exact: true }).click()
    await expect(page.getByRole('heading', { name: module, exact: true, level: 1 })).toBeVisible()
  }
  await expect(page.getByText('API pendiente')).toHaveCount(0)
  expect(pageErrors).toEqual([])
})

test('separa el acceso institucional del entorno demo y explica el alta de cuentas', async ({ page }) => {
  await page.goto('/acceso')
  await expect(page.getByLabel('Usuario')).toHaveValue('')
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Perfil de demostración')).toHaveCount(0)

  await page.getByRole('button', { name: 'Solicitar cuenta o recuperar acceso' }).click()
  await expect(page.getByRole('dialog', { name: 'Cuenta institucional' })).toBeVisible()
  await expect(page.getByText('Las cuentas no son de registro público.')).toBeVisible()
  await page.getByRole('button', { name: 'Entendido' }).click()

  await page.getByRole('tab', { name: 'Entorno de prueba' }).click()
  await expect(page.getByLabel('Perfil de demostración')).toBeVisible()
  await expect(page.getByLabel('Usuario')).toHaveValue('recepcion')
})

test('ofrece alta, edición, roles y auditoría en administración', async ({ page }) => {
  await installApiMock(page)
  await page.goto('/acceso')
  await page.getByRole('tab', { name: 'Entorno de prueba' }).click()
  await page.getByLabel('Perfil de demostración').selectOption('admin')
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click()
  await page.getByRole('button', { name: 'Administración', exact: true }).click()

  await page.getByRole('button', { name: 'Nuevo usuario' }).click()
  await expect(page.getByRole('dialog', { name: 'Crear cuenta institucional' })).toBeVisible()
  await page.getByLabel('Nombre de usuario').fill('nueva.cuenta')
  await page.getByLabel('Nombres').fill('Lucía')
  await page.getByLabel('Apellidos').fill('Mamani')
  await page.getByLabel('Correo institucional Opcional').fill('lucia.mamani@hospital.local')
  await page.getByLabel(/Contraseña inicial/).fill('Acceso-2026')
  await page.getByLabel('Confirmar contraseña').fill('Acceso-2026')
  await page.getByRole('checkbox', { name: /Admisión y recepción/ }).check()
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page.getByText('Lucía Mamani')).toBeVisible()

  await page.getByRole('tab', { name: 'Profesionales' }).click()
  await expect(page.getByText('Elena Vargas')).toBeVisible()
  await page.getByRole('button', { name: 'Crear doctor' }).click()
  await expect(page.getByRole('dialog', { name: 'Crear doctor' })).toBeVisible()
  await page.getByLabel('Nombre de usuario').fill('mario.perez')
  await page.getByLabel('Nombres').fill('Mario')
  await page.getByLabel('Apellidos').fill('Pérez')
  await page.getByLabel('Matrícula profesional').fill('RM-TEST-009')
  await page.getByLabel(/Contraseña inicial/).fill('Doctor-2026')
  await page.getByLabel('Confirmar contraseña').fill('Doctor-2026')
  await page.getByRole('checkbox', { name: /Cardiolog/ }).check()
  await page.getByRole('dialog', { name: 'Crear doctor' }).getByRole('button', { name: 'Crear doctor', exact: true }).click()
  await expect(page.getByText('Mario Pérez')).toBeVisible()

  await page.getByRole('tab', { name: 'Roles y permisos' }).click()
  await expect(page.getByRole('heading', { name: 'Roles disponibles' })).toBeVisible()
  await page.getByRole('tab', { name: 'Auditoría' }).click()
  await expect(page.getByRole('button', { name: 'Aplicar filtros' })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('revisa coincidencias antes de registrar otra ficha de paciente', async ({ page }) => {
  await installApiMock(page, [], { duplicates: [{ id: 'patient-1', patientCode: 'PAC-0001', documentType: 'CI', documentNumber: '7654321', firstName: 'Rosa', middleName: null, lastName: 'Mamani', secondLastName: null, fullName: 'Rosa Mamani', birthDate: '1988-05-10', sex: 'FEMALE', phone: null, email: null, address: null, emergencyContactName: null, emergencyContactPhone: null, bloodType: null, status: 'ACTIVE' }] })
  await page.goto('/acceso')
  await page.getByRole('tab', { name: 'Entorno de prueba' }).click()
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click()
  await page.getByRole('button', { name: 'Pacientes', exact: true }).click()
  await page.getByRole('button', { name: 'Registrar paciente' }).click()

  await page.getByLabel('Número de documento').fill('7654321')
  await page.getByLabel('Primer nombre').fill('Rosa')
  await page.getByLabel('Apellido paterno').fill('Mamani')
  await page.getByLabel('Fecha de nacimiento').fill('1988-05-10')
  await page.getByRole('button', { name: 'Revisar y registrar' }).click()

  await expect(page.getByText('Encontramos 1 posible coincidencia')).toBeVisible()
  await expect(page.getByText('Rosa Mamani')).toBeVisible()
  await page.getByRole('button', { name: 'Corregir datos' }).click()
  await expect(page.getByLabel('Número de documento')).toBeVisible()
})

test('mantiene landing y login dentro del viewport móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sistema Integrado de Información Hospitalaria' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.goto('/acceso')
  await expect(page.getByRole('heading', { name: 'Ingresar al SIIH' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

async function installApiMock(page: Page, requests: string[] = [], options: { duplicates?: unknown[] } = {}) {
  let currentUser = userResponse('recepcion')
  const mockUsers = [
    { id: '11111111-1111-1111-1111-111111111117', username: 'admin', firstName: 'Camila', lastName: 'Torres', displayName: 'Camila Torres', email: 'admin@hospital.local', status: 'ACTIVE', failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date().toISOString(), createdAt: '2026-01-10T12:00:00Z', roles: ['SYSTEM_ADMIN'], permissions: allPermissions },
    { id: '11111111-1111-1111-1111-111111111110', username: 'recepcion', firstName: 'Andrea', lastName: 'Suárez', displayName: 'Andrea Suárez', email: 'recepcion@hospital.local', status: 'ACTIVE', failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: '2026-07-20T13:30:00Z', createdAt: '2026-01-12T12:00:00Z', roles: ['RECEPTION'], permissions: receptionPermissions },
  ]
  const mockRoles = [
    { id: 'role-admin', code: 'SYSTEM_ADMIN', name: 'Administración del sistema', description: 'Gestiona identidad, permisos y auditoría.', active: true, permissions: allPermissions },
    { id: 'role-reception', code: 'RECEPTION', name: 'Admisión y recepción', description: 'Registra pacientes y gestiona su agenda.', active: true, permissions: receptionPermissions },
  ]
  const mockAudit = [
    { id: 'audit-1', userId: mockUsers[0].id, username: 'admin', action: 'LOGIN', entityType: 'USER', entityId: mockUsers[0].id, origin: '127.0.0.1', success: true, failureReason: null, eventAt: new Date().toISOString() },
  ]
  const mockSpecialties = [
    { id: 'specialty-med', code: 'MED_INT', name: 'Medicina interna', description: 'AtenciÃ³n integral del adulto' },
    { id: 'specialty-card', code: 'CARD', name: 'CardiologÃ­a', description: 'PrevenciÃ³n y tratamiento cardiovascular' },
  ]
  const mockProfessionals = [
    { id: 'professional-1', userId: 'doctor-1', username: 'elena.vargas', displayName: 'Elena Vargas', professionalCode: 'PROF-0001', licenseNumber: 'RM-DEMO-001', professionalType: 'DOCTOR', status: 'ACTIVE', specialties: ['Medicina interna'] },
  ]
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    requests.push(url.pathname)

    if (url.pathname.endsWith('/auth/login')) {
      const body = request.postDataJSON() as { username: string }
      currentUser = userResponse(body.username)
      return json(route, { accessToken: 'test-access-token', refreshToken: 'test-refresh-token', accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 28_800_000).toISOString(), user: currentUser })
    }
    if (url.pathname.endsWith('/auth/me')) return json(route, currentUser)
    if (url.pathname.endsWith('/auth/logout')) return route.fulfill({ status: 204 })
    if (url.pathname.endsWith('/auth/refresh')) return json(route, { accessToken: 'refreshed-token', refreshToken: 'rotated-token', accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 28_800_000).toISOString(), user: currentUser })
    if (url.pathname.endsWith('/users')) {
      if (request.method() === 'POST') {
        const body = request.postDataJSON() as { username: string; firstName: string; lastName: string; email?: string; roleCodes: string[] }
        const created = { id: `user-${mockUsers.length + 1}`, username: body.username, firstName: body.firstName, lastName: body.lastName, displayName: `${body.firstName} ${body.lastName}`, email: body.email ?? null, status: 'ACTIVE', failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: null, createdAt: new Date().toISOString(), roles: body.roleCodes, permissions: receptionPermissions }
        mockUsers.push(created)
        return json(route, created, 201)
      }
      return json(route, mockUsers)
    }
    if (url.pathname.endsWith('/roles')) return json(route, mockRoles)
    if (url.pathname.endsWith('/audit-events')) return json(route, mockAudit)
    if (url.pathname.endsWith('/professionals/admin')) return json(route, mockProfessionals)
    if (url.pathname.endsWith('/professionals')) {
      if (request.method() === 'POST') {
        const body = request.postDataJSON() as { username: string; firstName: string; lastName: string; licenseNumber: string; professionalType: string; specialtyIds: string[] }
        const created = { id: `professional-${mockProfessionals.length + 1}`, userId: `doctor-${mockProfessionals.length + 1}`, username: body.username, displayName: `${body.firstName} ${body.lastName}`, professionalCode: `PROF-TEST-${mockProfessionals.length + 1}`, licenseNumber: body.licenseNumber, professionalType: body.professionalType, status: 'ACTIVE', specialties: mockSpecialties.filter((item) => body.specialtyIds.includes(item.id)).map((item) => item.name) }
        mockProfessionals.push(created)
        return json(route, created, 201)
      }
      return json(route, mockProfessionals.map((item) => ({ id: item.id, professionalCode: item.professionalCode, professionalType: item.professionalType, displayName: item.displayName, licenseNumber: item.licenseNumber })))
    }
    if (url.pathname.endsWith('/specialties')) return json(route, mockSpecialties)
    if (url.pathname.endsWith('/patients/duplicate-check')) return json(route, options.duplicates ?? [])
    if (url.pathname.endsWith('/patients')) return json(route, pageResponse([]))
    if (url.pathname.endsWith('/appointments')) return json(route, pageResponse([]))
    if (url.pathname.endsWith('/overview')) return json(route, { summary: {}, catalog: [], orders: [], medications: [], prescriptions: [], locations: [], stock: [], movements: [], invoices: [], charges: [], payments: [], appointmentsByStatus: [], appointmentsBySpecialty: [], recentActivity: [], users: [], audit: [] })
    return json(route, [])
  })
}

function userResponse(username: string) {
  const admin = username === 'admin'
  return {
    id: admin ? '11111111-1111-1111-1111-111111111117' : '11111111-1111-1111-1111-111111111110',
    username: admin ? 'admin' : 'recepcion',
    displayName: admin ? 'Camila Torres' : 'Andrea Suárez',
    email: `${admin ? 'admin' : 'recepcion'}@hospital.local`,
    department: admin ? 'Administración del sistema' : 'Admisión central',
    role: admin ? 'SYSTEM_ADMIN' : 'RECEPTION',
    roleLabel: admin ? 'Administración del sistema' : 'Admisión y recepción',
    roles: [admin ? 'SYSTEM_ADMIN' : 'RECEPTION'],
    permissions: admin ? allPermissions : receptionPermissions,
  }
}

function pageResponse(content: unknown[]) {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true }
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}
