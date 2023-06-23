import { Observable, TypeofObservable } from './types'
import { pipe } from './util'

/**
 * Converts the arguments to an observable sequence.
 *
 * @param {...T} values A comma separated list of arguments you want to be emitted
 * @return {Observable} An Observable that emits the arguments
 * described above and then completes.
 */
export const of: <T extends any[]>(...args: T) => Observable<T[number]> =
  (...args: any[]) =>
  (sub: any) => {
    let subbed = true
    args.forEach((x) => subbed && sub(x))
    return () => (subbed = false)
  }

/**
 * Creates an Observable from an Array, an array-like object, a Promise, an iterable object, or an Observable-like object.
 *
 * @param {ObservableInput<T>} A subscription object, a Promise, an Array, a Map or a String.
 *
 * @return {Observable<T>}
 */
export const from: {
  <T extends any[]>(input: T): Observable<T[number]>
  <T extends any>(input: Promise<T>): Observable<T>
  <K extends any, T extends any>(input: Map<K, T>): Observable<[K, T]>
} = (input: any) => {
  if (Array.isArray(input)) return of(...input)
  if (input instanceof Map) return of(...Array.from(input.entries()))
  if (typeof input === 'string') return of(...input.split(''))
  if (input instanceof Promise) {
    return (sub: any) => {
      let subbed = true
      input.then((x) => subbed && sub(x))
      return () => (subbed = false)
    }
  }
  throw new Error(`Unsupported input`)
}

/**
 * Creates an Observable that emits events of a specific type coming from the
 * given event target.
 *
 * @param {FromEventTarget<T>} target The DOM EventTarget, Node.js EventEmitter to attach the event handler to.
 * @param {string} eventName The event name of interest, being emitted by the target.
 * @param {EventListenerOptions} [options] Options to pass through to addEventListener
 *
 * @return {Observable<T>}
 */
export const fromEvent: {
  <T extends HTMLElement, E extends keyof HTMLElementEventMap>(
    target: T,
    event: E,
    options?: boolean | AddEventListenerOptions,
  ): Observable<HTMLElementEventMap[E]>
  <T extends Window, E extends keyof WindowEventMap>(
    target: T,
    event: E,
    options?: boolean | AddEventListenerOptions,
  ): Observable<WindowEventMap[E]>
  <T extends Document | DocumentFragment, E extends keyof DocumentEventMap>(
    target: T,
    event: E,
    options?: boolean | AddEventListenerOptions,
  ): Observable<DocumentEventMap[E]>
  <T extends ShadowRoot, E extends keyof ShadowRootEventMap>(
    target: T,
    event: E,
    options?: boolean | AddEventListenerOptions,
  ): Observable<ShadowRootEventMap[E]>

  <T extends NodeStyleEventEmitter>(target: T, event: string | symbol): Observable<any>
} =
  (target: any, event: any, options?: any) =>
  (sub = (_x: any) => {}) => {
    if (target['addEventListener']) {
      target.addEventListener(event, sub, options)
      return () => target.removeEventListener(event, sub, options)
    }
    target.addListener(event, sub, options)
    return () => target.removeListener(event, sub, options)
  }

export interface NodeStyleEventEmitter {
  addListener(eventName: string | symbol, handler: (...args: any[]) => void): this
  removeListener(eventName: string | symbol, handler: (...args: any[]) => void): this
}

/**
 * Creates an output Observable which concurrently emits all values from every
 * given input Observable.
 *
 * @param {...ObservableInput} observables Input Observables to merge together.
 * @return {Observable} an Observable that emits items that are the result of
 * every input Observable.
 */
export const merge: <A extends Observable<any>[]>(...sources: A) => Observable<TypeofObservable<A[number]>> =
  (...oas) =>
  (sub) =>
    pipe(
      oas.map((x) => x(sub as any)),
      (s) => () => void s.forEach((fn) => fn()),
    )
