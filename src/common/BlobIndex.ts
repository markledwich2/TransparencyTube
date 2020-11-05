import { any } from 'prop-types'
import { toKey } from 'react-select/src/utils'
import { blobCfg, webCfg } from './Cfg'
import { Uri } from './Uri'
import { getJson, getJsonl, PartialRecord } from './Utils'
import { flatMap } from 'remeda'
import { entries } from './Pipe'

export interface BlobIndex<TRow, TKey extends Partial<TRow>> {
  keyFiles: IndexFile<TKey>[]
  baseUri: Uri
  fileRowsCache: { [key: string]: TRow[] }
  getRows: (filter: TKey | FilterRange<TKey>) => Promise<TRow[]>
}

interface IndexFile<TKey> {
  file: string,
  first: TKey,
  last: TKey
}

// type IndexFilter<TKey> = TKey | {from:string, to:string}
// type IndexFilterValue = string|

interface FilterRange<TKey> {
  from: TKey
  to: TKey
}
export const isFilterRange = <TKey>(f: any): f is FilterRange<TKey> => f.from != undefined

export const noCacheReq = { headers: { 'Cache-Control': 'no-cache' } }
const enableLocalCache = true

export const blobIndex = async <TRow, TKey>(path: string): Promise<BlobIndex<TRow, TKey>> => {
  const baseUri = blobCfg.indexUri.addPath(path)
  const baseUriCdn = blobCfg.indexCdnUri.addPath(path)
  const fileRowsCache = {}
  const index = await getJson<BlobIndex<TRow, TKey>>(baseUri.addPath('index.json.gz').url, noCacheReq)

  const compare = (file: TKey, filter: TKey) => {
    for (const key in file) {
      const av = file[key]
      const bv = filter[key]
      if (bv == null) continue
      const res = (av < bv ? -1 : (av > bv ? 1 : 0))
      if (res != 0) return res
    }
    return 0
  }

  const fileRows = async (file: string) => {
    const cache = enableLocalCache ? fileRowsCache[file] : null
    if (cache) return cache
    const rows = await getJsonl<TRow>(baseUriCdn.addPath(file).url)
    if (enableLocalCache)
      fileRowsCache[file] = rows
    return rows
  }

  const getRows = async (filter: TKey | FilterRange<TKey>) => {
    const fileOverlap = (f: IndexFile<TKey>) =>
      isFilterRange(filter) ?
        compare(f.first, filter.to) <= 0 && compare(f.last, filter.from) >= 0
        : compare(f.first, filter) <= 0 && compare(f.last, filter) >= 0

    const files = index.keyFiles.filter(fileOverlap)
    console.log('blobIndex. filter, matching files.', filter, files)
    const rows = flatMap(await Promise.all(files.map(f => fileRows(f.file))), r => r)
    const filtered = rows.filter((r: TKey) => {
      if (isFilterRange(filter)) {
        return compare(r, filter.from) >= 0 && compare(r, filter.to) <= 0 // ensure row falls within range. files will have some that don't match
      }
      return entries(filter).every(e => r[e[0]] == e[1]) // ensure each value of row matches
    })
    return filtered
  }

  return { ...index, baseUri, fileRowsCache, getRows }
}


