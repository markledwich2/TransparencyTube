
export interface ChannelMeasures {
  subs: number
  channelViews: number
  views7: number
  viewsP7: number
  views30: number
  viewsP30: number
  views365: number
  viewsP365: number
}

export interface ChannelData extends ChannelMeasures {
  channelId: string
  channelTitle: string
  tags: string[]
  logoUrl: string
  date_to: string
}

export interface TagMd { value: string, label?: string, color?: string }
export const tagsMd: TagMd[] = [
  { value: 'AntiSJW', label: 'Anti-SJW', color: '#8a8acb' },
  { value: 'AntiTheist', label: 'Anti-theist', color: '#96cbb3' },
  { value: 'Conspiracy', color: '#e0990b' },
  { value: 'LateNightTalkShow', label: 'Late night talk show', color: '#00b1b8' },
  { value: 'Libertarian', color: '#ccc' },
  { value: 'MRA', color: '#003e78' },
  { value: 'Mainstream News', label: 'MSM', color: '#aa557f' },
  { value: 'PartisanLeft', label: 'Partisan Left', color: '#3887be' },
  { value: 'PartisanRight', label: 'Partisan Right', color: '#e0393e' },
  { value: 'QAnon', color: '#e55e5e' },
  { value: 'ReligiousConservative', label: 'Religious Con.', color: '#41afa5' },
  { value: 'SocialJustice', label: 'Social Justice', color: '#56b881' },
  { value: 'Socialist', color: '#6ec9e0' },
  { value: 'WhiteIdentitarian', label: 'White Identitarian', color: '#b8b500' },
  { value: 'OrganizedReligion', label: 'Organized Religion' },
]