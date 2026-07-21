import { expect, test } from '@playwright/test'

test.skip(process.env.SIIH_LIVE !== '1', 'Requiere backend y PostgreSQL locales.')

test('recorre el SIIH contra el backend real', async ({ page }) => {
  const pageErrors: string[] = []
  const serverErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.url().includes('/api/v1/') && response.status() >= 500) {
      serverErrors.push(`${response.status()} ${response.url()}`)
    }
  })

  await page.goto('/acceso')
  await page.getByLabel('Perfil de demostración').selectOption('admin')
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click()
  await expect(page).toHaveURL(/\/app\/inicio$/)
  await expect(page.getByText('Camila Torres', { exact: true })).toBeVisible()

  const modules = ['Triaje', 'Hospitalización', 'Laboratorio', 'Farmacia', 'Inventario', 'Facturación', 'Reportes', 'Administración']
  for (const module of modules) {
    await page.getByRole('button', { name: module, exact: true }).click()
    await expect(page.getByRole('heading', { name: module, exact: true, level: 1 })).toBeVisible()
    await page.waitForTimeout(350)
  }

  const forms = [
    ['Triaje', 'Nuevo triaje'],
    ['Hospitalización', 'Ingresar paciente'],
    ['Laboratorio', 'Nueva orden'],
    ['Farmacia', 'Nueva receta'],
    ['Inventario', 'Nuevo lote'],
    ['Facturación', 'Cargo'],
    ['Administración', 'Nuevo usuario'],
  ] as const
  for (const [module, action] of forms) {
    await page.getByRole('button', { name: module, exact: true }).click()
    await page.getByRole('button', { name: action, exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
  }

  expect(pageErrors).toEqual([])
  expect(serverErrors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.getByRole('button', { name: 'Triaje', exact: true }).click()
  await page.screenshot({ path: 'test-results/live-triage-desktop.png', fullPage: true })
  await page.getByRole('button', { name: 'Facturación', exact: true }).click()
  await page.screenshot({ path: 'test-results/live-billing-desktop.png', fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Hospitalización', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Hospitalización', exact: true, level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/live-hospitalization-mobile.png', fullPage: true })
})

test('dirección navega sus vistas de lectura sin solicitudes prohibidas', async ({ page }) => {
  const apiErrors: string[] = []
  page.on('response', (response) => {
    if (response.url().includes('/api/v1/') && response.status() >= 400) {
      apiErrors.push(`${response.status()} ${response.url()}`)
    }
  })

  await page.goto('/acceso')
  await page.getByLabel('Perfil de demostración').selectOption('direccion')
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click()
  await expect(page).toHaveURL(/\/app\/inicio$/)

  for (const module of ['Agenda y citas', 'Laboratorio', 'Farmacia', 'Inventario', 'Facturación', 'Reportes']) {
    await page.getByRole('button', { name: module, exact: true }).click()
    await page.waitForTimeout(250)
  }
  expect(apiErrors).toEqual([])
})
