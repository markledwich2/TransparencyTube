import { any } from 'prop-types'
import { toKey } from 'react-select/src/utils'
import { blobCfg, webCfg } from './Cfg'
import { Uri } from './Uri'
import { getJson, getJsonl, PartialRecord } from './Utils'
import { flatMap, indexBy, splitAt } from 'remeda'
import { entries } from './Pipe'
import { isNamedExportBindings } from 'typescript'

export interface BlobIndex<TRow, TKey extends Partial<TRow>> {
  keyFiles: IndexFile<TKey>[]
  cols: Record<keyof TRow, IndexCol<TRow>>
  baseUri: Uri
  fileRowsCache: { [key: string]: TRow[] }
  rows: (...filters: (TKey | FilterRange<TKey>)[]) => Promise<TRow[]>
  rowsWith: (filters: (TKey | FilterRange<TKey>)[], cfg: GetRowsCfg<TRow>) => Promise<TRow[]>
}

export interface GetRowsCfg<TRow> {
  isComplete: ((rows: TRow[]) => boolean)
  parallelism?: number
  order?: 'asc' | 'desc'
}

export interface BlobIndexFile<TRow, TKey extends Partial<TRow>> {
  keyFiles: IndexFile<TKey>[]
  cols: IndexCol<TRow>[]
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

  let index: BlobIndexFile<TRow, TKey> = null
  try {
    index = await getJson<BlobIndexFile<TRow, TKey>>(indexUrl, noCacheReq)
  }
  catch (err) {
    console.error(`unable to to load json index (${indexUrl})`, err)
    throw err
  }

  console.log(`index loaded ${indexUrl}`, index)

  const compare = (file: TKey, filter: TKey) => {
    for (const key in file) {
      const fileValue = file[key]
      const filterValue = filter[key]
      if (filterValue == null) continue
      if (fileValue == null)
        return 1 // nulls last to match default ordering by DB
      const res = (fileValue < filterValue ? -1 : (fileValue > filterValue ? 1 : 0))
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

  const getRows = async (filters: (TKey | FilterRange<TKey>)[], cfg: GetRowsCfg<TRow> = null) => {
    const isComplete = cfg?.isComplete ?? ((_) => false)
    const parallelism = cfg?.parallelism ?? 8

    const fileOverlap = (f: IndexFile<TKey>) => filters.every(q => isFilterRange(q)
      ? compare(f.first, q.to) <= 0 && compare(f.last, q.from) >= 0
      : compare(f.first, q) <= 0 && compare(f.last, q) >= 0
    )

    let files = index.keyFiles.filter(fileOverlap)
    if (cfg?.order == 'desc') files = files.reverse()
    console.log(`index files in ${indexUrl} loaded`, files)
    let filtered: TRow[] = []

    while (files.length > 0) {
      const [toRead, remaining] = files.length <= parallelism ? [files, []] : splitAt(files, parallelism)
      files = remaining
      const rows = flatMap(await Promise.all(toRead.map(f => fileRows(f.file))), r => r)
      filtered = filtered.concat(rows.filter((r: TKey) => filters.every(q => isFilterRange(q)
        ? compare(r, q.from) >= 0 && compare(r, q.to) <= 0 // ensure row falls within range. files will have some that don't match
        : entries(q).every(([p, v]) => r[p] == v) // ensure each value of row matches
      )))

      if (isComplete(filtered)) {
        console.log(`getRows isComplete = true: returning now`, filters)
        break
      }
    }

    console.log(`${filtered.length} index rows returned for filter:`, filters)
    console.table(filtered.slice(0, 10))

    return filtered
  }

  return {
    keyFiles: index.keyFiles,
    cols: indexBy(index.cols, c => c.name) as Record<keyof TRow, IndexCol<TRow>>,
    baseUri,
    fileRowsCache,
    rows: ((...fs) => getRows(fs)),
    rowsWith: getRows
  }
}


