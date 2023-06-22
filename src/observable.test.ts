import { it, expect } from 'vitest'

import { of, merge, fromInterval, fromPromise, distinct } from './observable'
import { pipe } from './util'

it('of', () => {
  const [get, sub] = collect<number>()
  of(10)(sub)
  expect(get()).toEqual([10])
})

it('fromPromise', async () => {
  const [get, sub] = collect<number | null>()
  fromPromise(() => Promise.resolve(10))((x) => sub(x[0]))
  await Promise.resolve()
  expect(get()).toEqual([10])
})

it('fromInterval', async () => {
  const [get, sub] = collect<number>()
  const stop = fromInterval(10)(sub)
  await new Promise((res) => setTimeout(res, 100))
  stop()
  expect(get()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
})

it('merge', () => {
  const [get, sub] = collect<number>()
  merge(of(10), of(11))(sub)
  expect(get()).toEqual([10, 11])
})

it('distinct', () => {
  const [get, sub] = collect<number>()
  pipe(of(10, 10, 11), distinct())(sub)
  expect(get()).toEqual([10, 11])
})

const collect = <T>() => {
  const values: T[] = []
  return [() => values, (y: T) => values.push(y)] as const
}
