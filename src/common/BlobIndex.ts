import { any } from 'prop-types'
import { toKey } from 'react-select/src/utils'
import { blobCfg, webCfg } from './Cfg'
import { Uri } from './Uri'
import { getJson, getJsonl } from './Utils'
import { flatMap } from 'remeda'

export interface BlobIndex<TRow, TKey extends Partial<TRow>> {
  keyFiles: IndexFile<TKey>[]
  baseUri: Uri
  fileRowsCache: { [key: string]: TRow[] }
  getRows: (filter: TKey) => Promise<TRow[]>
}

interface IndexFile<TKey> {
  file: string,
  first: TKey,
  last: TKey
}

export const noCacheReq = { headers: { 'Cache-Control': 'no-cache' } }
const enableLocalCache = false

export const blobIndex = async <TRow, TKey>(path: string): Promise<BlobIndex<TRow, TKey>> => {
  const baseUri = blobCfg.indexUri.addPath(path)
  const baseUriCdn = blobCfg.indexCdnUri.addPath(path)
  const fileRowsCache = {}
  const index = await getJson<BlobIndex<TRow, TKey>>(baseUri.addPath('index.json.gz').url, noCacheReq)

  const compare = (a: TKey, b: TKey) => {
    for (const key in a) {
      const av = a[key]
      const bv = b[key]
      const res = (av < bv ? -1 : (av > bv ? 1 : 0))
      if (res != 0) return res
    }
    return 0
  }

  const fileRows = async (file: string) => {
    const cache = enableLocalCache ? fileRowsCache[file] : null
    if (cache) return cache
    const rows = await getJsonl<TRow>(baseUriCdn.addPath(file).url)
    fileRowsCache[file] = rows
    return rows
  }

  const getRows = async (filter: TKey) => {
    const filterEntries = Object.entries(filter)
    const match = (f: IndexFile<TKey>) => compare(f.first, filter) <= 0 && compare(f.last, filter) >= 0
    const files = index.keyFiles.filter(match)
    const rows = flatMap(await Promise.all(files.map(f => fileRows(f.file))), r => r)
    const filtered = rows.filter(r => filterEntries.every(e => r[e[0]] == e[1]))
    return filtered
  }

  return { ...index, baseUri, fileRowsCache, getRows }
}


