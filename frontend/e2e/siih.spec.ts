import { expect, test } from '@playwright/test'

test('presenta la landing y dirige al acceso', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Sistema Integrado de Información Hospitalaria' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ingresar al sistema/ })).toBeVisible()
  await expect(page.locator('.landing-hero')).toHaveCSS('background-image', /siih-hero/)
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.locator('body').evaluate((element) => element.clientWidth))
  await page.screenshot({ path: 'test-results/landing-desktop.png', fullPage: true })
})

test('protege el workspace y aplica el menú del rol recepción', async ({ page }) => {
  await page.goto('/app/inicio')
  await expect(page).toHaveURL(/\/acceso$/)

  await page.getByRole('button', { name: 'Ingresar al sistema' }).click()
  await expect(page).toHaveURL(/\/app\/inicio$/)
  await expect(page.getByText('Andrea Suárez', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Pacientes/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Agenda y citas/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Laboratorio/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Administración/ })).toHaveCount(0)
  await page.screenshot({ path: 'test-results/workspace-recepcion.png', fullPage: true })
})

test('muestra todos los módulos al administrador', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.route('**/api/v1/*/overview', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ summary: {} }) }))
  await page.goto('/acceso')
  await page.getByLabel('Perfil de demostración').selectOption('admin')
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click()

  await expect(page.getByText('Camila Torres', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Laboratorio/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Hospitalización/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Administración', exact: true })).toBeVisible()

  const modules = [
    ['Triaje', 'Triaje'],
    ['Hospitalización', 'Hospitalización'],
    ['Laboratorio', 'Laboratorio'],
    ['Farmacia', 'Farmacia'],
    ['Inventario', 'Inventario'],
    ['Facturación', 'Facturación'],
    ['Reportes', 'Reportes'],
    ['Administración', 'Administración'],
  ] as const
  for (const [navigationLabel, heading] of modules) {
    await page.getByRole('button', { name: navigationLabel, exact: true }).click()
    await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible()
  }
  expect(pageErrors).toEqual([])
})

test('mantiene landing y login dentro del viewport móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sistema Integrado de Información Hospitalaria' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/landing-mobile.png', fullPage: true })

  await page.goto('/acceso')
  await expect(page.getByRole('heading', { name: 'Ingresar al SIIH' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/login-mobile.png', fullPage: true })
})
