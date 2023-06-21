# Mini RX
This is a tiny reactive library which defines helpers for use on the observable type `type Observable<T> = (sub: (x: T) => void) => () => void`. Many of the helpers are copied from [rxjs](https://github.com/ReactiveX/rxjs)

# Examples
```typescript
import { pipe, from, map, scan, merge, switchMap, fromInterval } from 'mini-rx'
import { fromEvent } from 'mini-rx/dom'

const $clicks = fromEvent(document.body, 'click')
const $total_clicks = pipe($clicks, scan(0, (t) => t + 1))

const $mouse_is_down = pipe(
  merge(
    pipe(fromEvent('mousedown'), map(() => true)),
    pipe(fromEvent('mouseup'), map(() => false))
  ),
)

const $mouse_position = pipe(
  fromEvent('mousemove'),
  map(e => ({ x: e.clientX, y: e.clientY })),
)

const $mouse_position_when_mouse_down = pipe(
  $mouseIsDown,
  switchMap(x => x ? from() : $mousePosition)
)
```
