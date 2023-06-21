import { it, expect } from 'vitest'

import {
  from,
  fromLazy,
  merge,
  fromInterval,
  fromPromise,
  distinct,
  switchMap,
  map,
  filter,
  scan,
  switchScan,
} from './observable'
import { pipe } from './util'

it('from', () => {
  const [get, sub] = collect<number>()
  from(10)(sub)
  expect(get()).toEqual([10])
})

it('fromLazy', () => {
  const [get, sub] = collect<number>()
  fromLazy(() => 10)(sub)
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

it('map', () => {
  const [get, sub] = collect<number>()
  pipe(
    from(10, 11),
    map((x) => x + 1),
  )(sub)
  expect(get()).toEqual([11, 12])
})

it('switchMap', () => {
  const [get, sub] = collect<number>()
  pipe(
    from(10, 11),
    switchMap((x) => from(x + 1, x + 2)),
  )(sub)
  expect(get()).toEqual([11, 12, 12, 13])
})

it('filter', () => {
  const [get, sub] = collect<number>()
  pipe(
    from<string | number>('10', 11, '12'),
    filter((x): x is number => typeof x === 'number'),
  )(sub)
  expect(get()).toEqual([11])
})

it('scan', () => {
  const [get, sub] = collect<number>()
  pipe(
    from(10, 11, 12),
    scan(0, (a, b) => a + b),
  )(sub)
  expect(get()).toEqual([10, 21, 33])
})

it('switchScan', () => {
  const [get, sub] = collect<number>()
  pipe(
    from(10, 11, 12),
    switchScan(0, (a, b) => from(a + b)),
  )(sub)
  expect(get()).toEqual([10, 21, 33])
})

it('merge', () => {
  const [get, sub] = collect<number>()
  pipe([from(10), from(11)], merge)(sub)
  expect(get()).toEqual([10, 11])
})

it('distinct', () => {
  const [get, sub] = collect<number>()
  pipe(from(10, 10, 11), distinct())(sub)
  expect(get()).toEqual([10, 11])
})

const collect = <T>() => {
  const values: T[] = []
  return [() => values, (y: T) => values.push(y)] as const
}
