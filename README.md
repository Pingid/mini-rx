A small barebones reactive library built for a stripped back observable primitive. The api and method names are borrowed from [rxjs](https://github.com/ReactiveX/rxjs).


[![Build Status](https://img.shields.io/github/actions/workflow/status/Pingid/mini-rx/test.yml?branch=main&style=flat&colorA=000000&colorB=000000)](https://github.com/Pingid/mini-rx/actions?query=workflow:Test)
[![Build Size](https://img.shields.io/bundlephobia/minzip/mini-rx?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=mini-rx)
[![Version](https://img.shields.io/npm/v/mini-rx?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/mini-rx)
[![Downloads](https://img.shields.io/npm/dt/mini-rx.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/mini-rx)

```bash
npm install mini-rx # or yarn add mini-rx or pnpm add mini-rx
```

## Observable
Unlike [rxjs](https://github.com/ReactiveX/rxjs) this observable provides no error pathway and never completes.
```ts
type Observable<T> = (subscriber: (x: T) => void): () => void
```

**Example Usage**
```typescript
import { pipe, merge, map, of, switchMap  } from 'mini-rx'
import { fromEvent } from 'mini-rx/dom'

const box = document.getElementById('#box');

const $pointer_over = pipe(
  merge(
    pipe(fromEvent(box, 'pointerenter'), map(() => true)),
    pipe(fromEvent(box, 'pointerleave'), map(() => false))
  ),
)

// Get the pointer position when pointer is over box
const $pointer_position = pipe(
  $pointer_over,
  switchMap(is_over => is_over ? fromEvent(box, 'pointermove') : of()),
  map(e => ({ x: e.clientX, y: e.clientY }))
)

// Subscribe to events
$pointer_over((x: boolean) => ...)
$pointer_position((x: { x: nunber, y: number }) => ...)
```
