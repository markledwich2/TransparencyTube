export interface Rec {
  fromVideoId: string
  toVideoId: string
  day: string
  label: string
  accounts: string[]
  fromVideoTitle: string
  fromChannelId: string
  toVideoTitle: string
  toChannelId: string
  toChannelTitle: string
}

export interface Watch {
  account: string
  updated: string
  videoId: string
  videoTitle: string
  channelId: string
  channelTitle: string
}

export type WatchKey = Pick<Watch, 'updated'>

export type RecVideo = Omit<Rec, 'fromVideoId' | 'fromVideoTitle' | 'day'> & { recs: Rec[], id: string }
export type RecGroup = Pick<Rec, 'toChannelId' | 'toChannelTitle'> & { id: string, groupAccounts: string[], videoRecs: RecVideo[] }
export const isRec = (o: any): o is Rec => o.fromVideoId !== undefined && o.toVideoId !== undefined
export const isRecVideo = (o: any): o is RecVideo => o.groupAccounts !== undefined && o.recs !== undefined
export const isRecGroup = (o: any): o is RecGroup => o.toChannelId !== undefined && o.videoRecs !== undefined
