import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'

import { getCache, saveCache } from '../cache.js'
import { cleanCache, getRunningTime } from '../get-running-time.js'

const EXAMPLE = join(__dirname, '../node_modules/nanoid/index.browser.js')
const CACHE = join(__dirname, '..', '..', '.cache')

afterEach(async () => {
  delete process.env.SIZE_LIMIT_FAKE_TIME
  cleanCache()
  await rm(CACHE, { force: true, recursive: true })
})

it('calculates running time', async () => {
  let runTime = await getRunningTime(EXAMPLE)
  expect(runTime).toBeGreaterThan(0.009)
  expect(runTime).toBeLessThan(0.5)
}, 15_000)

it('uses cache', async () => {
  process.env.SIZE_LIMIT_FAKE_TIME = 1
  expect(await getRunningTime(EXAMPLE)).toBe(1)

  let throttling = await getCache()
  await saveCache(throttling * 100)
  expect(await getRunningTime(EXAMPLE)).toBe(1)

  cleanCache()
  expect(await getRunningTime(EXAMPLE)).toBe(100)
})

it('ignores non-JS files', async () => {
  expect(await getRunningTime('/a.jpg')).toBe(0)
})

it('works in parallel', async () => {
  process.env.SIZE_LIMIT_FAKE_TIME = 1
  let times = await Promise.all([
    getRunningTime(EXAMPLE),
    getRunningTime(EXAMPLE),
    getRunningTime(EXAMPLE),
    getRunningTime(EXAMPLE)
  ])
  expect(times).toHaveLength(4)
})
