import { Observable } from './types'
import { dispose } from './util'

/**
 * Applies a given transform function to each value emitted by the source
 * Observable, and emits the resulting values as an Observable.
 *
 * @param {function(value: A): B} transform The function to apply
 * to each `value` emitted by the source Observable.
 * @return A function that accepts an Observable and returns an Observable
 * where the emitted values are transformed.
 */
export const map: <A, B>(transform: (a: A) => B) => (source: Observable<A>) => Observable<B> =
  (transform) => (source) => (sub) =>
    source((x) => sub(transform(x)))

/**
 * Projects each emitted source value to an Observable which is merged in the output
 * Observable, emitting values only from the most recently projected Observable.
 *
 * @param {function(value: A): Observable<B>} transform The function to apply
 * to each `value` emitted by the source Observable.
 * @return A function that accepts an Observable and returns an Observable
 * where the emitted values are transformed.
 */
export const switchMap: <A, B>(transform: (a: A) => Observable<B>) => (source: Observable<A>) => Observable<B> =
  (transform) => (source) => {
    let last = () => {}
    return (sub) => {
      const current = source((x) => {
        last()
        last = transform(x)((y) => sub(y))
      })
      return () => (last(), current())
    }
  }

/**
 * Filter items emitted by the source Observable by only emitting those that
 * satisfy a specified predicate.
 *
 * @param predicate The function to apply
 * evaluates each value emitted by the source Observable. If it returns `true`,
 * the value is emitted, if `false` the value is not passed to the output
 * Observable.
 *
 * @return A function that returns an Observable that emits items from the
 * source Observable that satisfy the specified `predicate`.
 */
export const filter: {
  <A, B extends A = A>(predicate: (a: A) => a is B): (oa: Observable<A>) => Observable<B>
  <A, B extends A = A>(predicate: (a: A) => boolean): (oa: Observable<A>) => Observable<B>
} =
  (pred) =>
  (oa) =>
  (sub = (_x) => {}) =>
    oa((x: any) => (pred(x) ? sub(x) : null))

/**
 * Maintains some state based on the values emited from a source observable and emits the state
 * when the source emits.
 *
 * @param initial A starting value to initialize the internal state
 * @param accumulator A "reducer function". This will be called for each value after an initial state is
 * acquired.
 *
 * @return A function that returns an Observable of the accumulated values.
 */
export const scan: <A, B>(initial: A, accumulator: (a: A, b: B) => A) => (source: Observable<B>) => Observable<A> =
  (initial, accumulator) => (source) => {
    let c = initial
    return (sub) =>
      source((x) => {
        c = accumulator(c, x)
        return sub(c)
      })
  }

export const switchScan =
  <A, B>(initial: A, cb: (a: A, b: B) => Observable<A>) =>
  (ob: Observable<B>): Observable<A> => {
    let c = initial
    return (sub) => {
      let last = () => {}
      return dispose(
        ob((x) => {
          last()
          last = cb(
            c,
            x,
          )((a) => {
            c = a
            sub(a)
          })
        }),
        last,
      )
    }
  }
