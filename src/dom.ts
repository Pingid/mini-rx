import { Observable } from './types'

/**
 * Creates an output Observable which emits every animation frame
 *
 * @param {Window} targe the target window to call requestAnimationFrame on.
 * @return {Observable} an Observable that emits DOMHighResTimeStamp on every animation frame
 */
export const animationFrame: (target?: Window) => Observable<DOMHighResTimeStamp> =
  (t = window) =>
  (sub) => {
    let f = NaN
    let frame = (ms: DOMHighResTimeStamp) => {
      sub(ms)
      f = t.requestAnimationFrame(frame)
    }
    f = t.requestAnimationFrame(frame)
    return () => t.cancelAnimationFrame(f)
  }
