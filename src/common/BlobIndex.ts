import { any } from 'prop-types'
import { toKey } from 'react-select/src/utils'
import { blobCfg, webCfg } from './Cfg'
import { Uri } from './Uri'
import { getJson, getJsonl, PartialRecord } from './Utils'
import { flatMap } from 'remeda'
import { entries } from './Pipe'

export interface BlobIndex<TRow, TKey extends Partial<TRow>> {
  keyFiles: IndexFile<TKey>[]
  cols: IndexCol<TRow>[]
  baseUri: Uri
  fileRowsCache: { [key: string]: TRow[] }
  getRows: (...filters: (TKey | FilterRange<TKey>)[]) => Promise<TRow[]>
}

interface IndexCol<TRow> {
  name: keyof TRow,
  inIndex: boolean,
  dbName?: string,
  distinct?: string[]
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

export const blobIndex = async <TRow, TKey>(path: string, cdn = true): Promise<BlobIndex<TRow, TKey>> => {
  const subPath = [path, blobCfg.indexVersion]
  const baseUri = blobCfg.indexUri.addPath(...subPath)
  const baseUriCdn = cdn ? blobCfg.indexCdnUri.addPath(...subPath) : baseUri
  const fileRowsCache = {}
  const indexUrl = baseUri.addPath('index.json.gz').url

  let index: BlobIndex<TRow, TKey> = null
  try {
    index = await getJson<BlobIndex<TRow, TKey>>(indexUrl, noCacheReq)
  }
  catch (err) {
    console.error(`unable to to load json index (${indexUrl})`, err)
    throw err
  }

  console.log(`index loaded ${indexUrl}`, index)

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
    const path = baseUriCdn.addPath(file).url

    let rows: TRow[] = []
    try {
      rows = await getJsonl<TRow>(path)
    }
    catch (err) {
      console.error(`Error loading index file ${path}`)
    }
    if (rows && enableLocalCache)
      fileRowsCache[file] = rows
    return rows
  }

  const getRows = async (...filters: [TKey | FilterRange<TKey>]) => {
    const fileOverlap = (f: IndexFile<TKey>) => filters.every(q => isFilterRange(q) ?
      compare(f.first, q.to) <= 0 && compare(f.last, q.from) >= 0
      : compare(f.first, q) <= 0 && compare(f.last, q) >= 0)

    const files = index.keyFiles.filter(fileOverlap)
    console.log(`index files in ${indexUrl} loaded`, files)
    const rows = flatMap(await Promise.all(files.map(f => fileRows(f.file))), r => r)
    const filtered = rows.filter((r: TKey) => filters.every(q => {
      if (isFilterRange(q))
        return compare(r, q.from) >= 0 && compare(r, q.to) <= 0 // ensure row falls within range. files will have some that don't match
      return entries(q).every(([p, v]) => r[p] == v) // ensure each value of row matches
    }))
    console.log(`${filtered.length} index rows returned`)
    console.table(filtered.slice(0, 10))
    return filtered
  }

  return { ...index, baseUri, fileRowsCache, getRows }
}


