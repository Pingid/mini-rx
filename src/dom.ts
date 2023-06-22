import { Observable } from './types'

type NonEmpty<T> = [keyof T, ...(keyof T)[]]

export const fromEvent: {
  <H extends HTMLElement, K extends NonEmpty<HTMLElementEventMap>>(target: H, ...args: K): Observable<
    HTMLElementEventMap[K[number]]
  >
  <H extends Window, K extends NonEmpty<WindowEventMap>>(target: H, ...args: K): Observable<WindowEventMap[K[number]]>
  <H extends Document | DocumentFragment, K extends NonEmpty<DocumentEventMap>>(target: H, ...args: K): Observable<
    DocumentEventMap[K[number]]
  >
  <H extends ShadowRoot, K extends NonEmpty<ShadowRootEventMap>>(target: H, ...args: K): Observable<
    ShadowRootEventMap[K[number]]
  >
  <K extends NonEmpty<WindowEventMap>>(...args: K): Observable<WindowEventMap[K[number]]>
} =
  (h: any, ...args: [any]) =>
  (sub = (_x: any) => {}) => {
    let [root, ks]: [any, Array<keyof WindowEventMap>] = typeof h === 'object' ? [h, args] : [window, [h, ...args]]
    const subs = ks.map((k) => {
      root.addEventListener(k, sub)
      return () => root.removeEventListener(k, sub)
    })
    return () => subs.forEach((cb) => cb())
  }
