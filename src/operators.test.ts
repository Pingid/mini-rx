import { it, expect } from 'vitest'

import { map, switchMap, filter, scan, switchScan } from './operators'
import { of } from './observable'
import { pipe } from './util'

it('map', () => {
  const [get, sub] = collect<number>()
  pipe(
    of(10, 11),
    map((x) => x + 1),
  )(sub)
  expect(get()).toEqual([11, 12])
})

it('switchMap', () => {
  const [get, sub] = collect<number>()
  pipe(
    of(10, 11),
    switchMap((x) => of(x + 1, x + 2)),
  )(sub)
  expect(get()).toEqual([11, 12, 12, 13])
})

it('filter', () => {
  const [get, sub] = collect<number>()
  pipe(
    of<string | number>('10', 11, '12'),
    filter((x): x is number => typeof x === 'number'),
  )(sub)
  expect(get()).toEqual([11])
})

it('scan', () => {
  const [get, sub] = collect<number>()
  pipe(
    of(10, 11, 12),
    scan(0, (a, b) => a + b),
  )(sub)
  expect(get()).toEqual([10, 21, 33])
})

const collect = <T>() => {
  const values: T[] = []
  return [() => values, (y: T) => values.push(y)] as const
}
