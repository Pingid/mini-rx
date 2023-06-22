export interface Observable<T> {
  (subscriber: (x: T) => void): () => void
}
export type TypeofObservable<T> = T extends Observable<infer D> ? D : never
