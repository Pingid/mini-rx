import { it, expect, vi } from 'vitest'

import { of, merge, fromEvent } from './observable'
import { pipe } from './util'

it('of', () => {
  const [get, sub] = collect<number>()
  of(10)(sub)
  expect(get()).toEqual([10])
})

it('fromEvent dom event target', async () => {
  const [addEventListener, removeEventListener, listener] = [vi.fn(), vi.fn(), vi.fn()]
  const stop = fromEvent({ addEventListener, removeEventListener } as any as Document, 'abort', { passive: true })(
    listener,
  )
  expect(addEventListener.mock.calls).toEqual([['abort', listener, { passive: true }]])
  stop()
  expect(removeEventListener.mock.calls).toEqual([['abort', listener, { passive: true }]])
})

it('fromEvent node event emmitter target', async () => {
  const [addListener, removeListener, listener] = [vi.fn(), vi.fn(), vi.fn()]
  const stop = fromEvent({ addListener, removeListener }, 'abort')(listener)
  expect(addListener.mock.calls).toEqual([['abort', listener, undefined]])
  stop()
  expect(removeListener.mock.calls).toEqual([['abort', listener, undefined]])
})

it('merge', () => {
  const [get, sub] = collect<number>()
  merge(of(10), of(11))(sub)
  expect(get()).toEqual([10, 11])
})

const collect = <T>() => {
  const values: T[] = []
  return [() => values, (y: T) => values.push(y)] as const
}
