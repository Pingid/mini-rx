import { Observable, TypeofObservable } from './types.js'
import { dispose, pipe } from './util.js'

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

export const fromInterval: {
  (x: number): Observable<number>
} = (x) => (sub) => {
  let count = 0
  void (sub(count), count++)
  let clear: any = setInterval(() => (sub(count), count++), x)
  return () => clearInterval(clear)
}

export const fromPromise: {
  <T>(fn: () => Promise<T>): Observable<[success: T, error: undefined] | [success: null, error: unknown]>
} = (x) => (sub) => {
  let canceled = false
  x().then(
    (y) => !canceled && sub([y, undefined]),
    (error) => !canceled && sub([null, error]),
  )
  return () => void (canceled = true)
}

export const fromAnimationFrame: {
  (): Observable<DOMHighResTimeStamp>
} = () => (sub) => {
  let f = NaN
  let frame = (ms: DOMHighResTimeStamp) => {
    sub(ms)
    f = requestAnimationFrame(frame)
  }
  f = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(f)
}

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
