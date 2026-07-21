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

test('mantiene landing y login dentro del viewport móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sistema Integrado de Información Hospitalaria' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.goto('/acceso')
  await expect(page.getByRole('heading', { name: 'Ingresar al SIIH' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

async function installApiMock(page: Page, requests: string[] = []) {
  let currentUser = userResponse('recepcion')
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

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}
