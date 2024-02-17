import { Observable, TypeofObservable } from './types'
import { dispose, pipe } from './util'

/**
 * The above function is a TypeScript implementation of an Observable that takes in a variable number
 * of arguments and emits each argument to its subscribers.
 * @param {any[]} args - args is a rest parameter of type T, which is a generic array type that can
 * contain any type of elements.
 * @returns a function that takes a subscriber as an argument.
 */
export const of: <T extends any[]>(...args: T) => Observable<T[number]> =
  (...args: any[]) =>
  (sub: any) => {
    let subbed = true
    args.forEach((x) => subbed && sub(x))
    return () => (subbed = false)
  }

/**
 * Converts the arguments to an observable sequence.
 *
 * @param {...T} values A comma separated list of arguments you want to be emitted
 * @return {Observable} An Observable that emits the arguments
 * described above and then completes.
 */

/**
 * Creates an Observable from an Array, an array-like object, a Promise, an iterable object, or an Observable-like object.
 *
 * @param {ObservableInput<T>} A subscription object, a Promise, an Array, a Map or a String.
 *
 * @return {Observable<T>}
 */

/**
 * The `from` function converts various types of input into an Observable.
 * @param {any} input - The `input` parameter can be of type `Array`, `Promise`, or `Map`.
 * @returns an Observable.
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

/**
 * The `fromEvent` function is a TypeScript implementation that creates an Observable from an event
 * emitted by a target element, window, document, document fragment, or shadow root.
 * @param {any} target - The target parameter represents the element or object to which the event
 * listener will be attached. It can be an HTMLElement, Window, Document, DocumentFragment, ShadowRoot,
 * or any object that implements the NodeStyleEventEmitter interface.
 * @param {any} event - The `event` parameter is the name of the event that you want to listen for. It
 * can be a string representing the event name (e.g., "click", "keydown") or a symbol representing a
 * custom event.
 * @param {any} [options] - The `options` parameter is an optional argument that specifies additional
 * options for the event listener. It can be a boolean value or an `AddEventListenerOptions` object.
 * The `AddEventListenerOptions` object allows you to specify options such as `capture`, `once`, and
 * `passive`.
 * @returns The `fromEvent` function returns a function that takes in a target, event, and options, and
 * returns an Observable.
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

export const distinct: {
  <A>(): (oa: Observable<A>) => Observable<A>
  <A>(eq: (a: A, b?: A) => boolean): (oa: Observable<A>) => Observable<A>
} = (eq?: any) => (o) => (cb) => {
  let c: any = Symbol('init')
  return o((x) => {
    if (eq ? eq(x, c) : x === c) return
    c = x
    cb(x)
  })
}

export const tap: <A>(operator: (a: A) => any) => (ob: Observable<A>) => Observable<A> = (operator) => (ob) => (sub) =>
  ob((x) => (operator(x), sub(x)))

export const wait =
  <A>(n: number) =>
  (oa: Observable<A>): Observable<A> =>
    Object.assign((sub: any = () => {}) => {
      let timeout: any
      let unsub = oa((x) => (timeout = setTimeout(() => sub(x), n)))
      return () => {
        unsub()
        window.clearTimeout(timeout)
      }
    }, oa)

export const throttle =
  <A>(n: number) =>
  (oa: Observable<A>): Observable<A> =>
    Object.assign((sub: any = () => {}) => {
      let lastCalled = 0
      return oa((x) => {
        if (Date.now() - lastCalled > n) {
          lastCalled = Date.now()
          sub(x)
        }
      })
    }, oa)

export const join: {
  <T extends readonly Observable<any>[]>(x: T): Observable<{ [K in keyof T]?: TypeofObservable<T[K]> }>
  <T extends readonly Observable<any>[]>(x: T, i: { [K in keyof T]: TypeofObservable<T[K]> }): Observable<{
    [K in keyof T]: TypeofObservable<T[K]>
  }>
  <T extends { [x: string]: Observable<any> }>(x: T): Observable<{ [K in keyof T]?: TypeofObservable<T[K]> }>
  <T extends { [x: string]: Observable<any> }>(x: T, i: { [K in keyof T]: TypeofObservable<T[K]> }): Observable<{
    [K in keyof T]: TypeofObservable<T[K]>
  }>
} = (x: any, init?: any) => (cb: any) => {
  if (Array.isArray(x)) {
    let res: any = init ? [...init] : []
    return dispose(
      x.map((ao, i) => {
        res[i] = undefined
        return ao((y: any) => {
          res[i] = y
          cb(res)
        })
      }),
    )
  }

  let res: any = { ...init }
  return dispose(
    Object.keys(x).map((key) => {
      res[key] = undefined
      return x[key]((y: any) => {
        res[key] = y
        cb(res)
      })
    }),
  )
}

/*
  Multicasting
*/
export const multi = <A>() => {
  let listeners = new Set<(x: A) => void>()
  let s: (() => void) | null = null
  return (oa: Observable<A>): Observable<A> =>
    (sub) => {
      listeners.add(sub)
      if (!s) s = oa((x) => listeners.forEach((cb) => cb(x)))
      return () => {
        listeners.delete(sub)
        if (listeners.size === 0 && s) {
          s()
          s = null
        }
      }
    }
}

/*
  Scheduling
*/
export const schedule =
  <T>(x: Observable<any>) =>
  (o: Observable<T>): Observable<T> =>
  (sub) => {
    let queue: any[] = []
    const emit = () => {
      if (queue.length === 0) return
      const [h, ...tail] = queue
      queue = tail
      sub(h)
    }

    return dispose(
      x(emit),
      o((y) => queue.push(y)),
    )
  }

export const scheduleLast =
  <T>(x: Observable<any>) =>
  (o: Observable<T>) =>
  (sub = (_x: T) => {}) => {
    let last: null | { value: any } = null
    const emit = () => {
      if (!last?.value) return
      sub(last?.value)
      last = null
    }

    return dispose(
      x(emit),
      o((value) => (last = { value })),
    )
  }

/*
  Replay
*/
export const replay: <A>(n: number, ...args: A[]) => (o: Observable<A>) => Observable<A> = (n, ...args) => {
  let last: any[] = args.slice(args.length - 1 - n)
  return (o) => {
    return (sub) => {
      last.forEach((x) => sub(x))
      return o((x) => {
        last = [...last, x].slice(args.length - 1 - n)
        sub(x)
      })
    }
  }
}
