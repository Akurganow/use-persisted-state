export type UsePersistedState<T> = [T, (value: T | ((previousState: T) => T)) => void | Promise<void>]

export type PersistedState = <T>(key: string, initialValue: T) => UsePersistedState<T>
