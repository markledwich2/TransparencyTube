export type PrefixAll<T, P extends string> = {
  [K in keyof T & string as `${P}${Capitalize<K>}`]: T[K]
}

export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T
}

export type FilterKeys<T extends object, P extends unknown> = {
  [K in keyof T]: T[K] extends P ? K : never
}[keyof T]