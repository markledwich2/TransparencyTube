export type PrefixAll<T, P extends string> = {
  [K in keyof T & string as `${P}${Capitalize<K>}`]: T[K]
}