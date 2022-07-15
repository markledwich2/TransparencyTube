
import React, { useMemo } from 'react'
import { FlexCenter, FlexRow, NarrowSection, styles } from '../Style'
import { Channel } from '../../common/Channel'
import { PersonaVenn } from './PersonaVenn'
import { keys, takeRandom } from '../../common/Pipe'
import { numFormat } from '../../common/Utils'
import { FilterHeader as FH, FilterPart as FP } from '../FilterCommon'
import { InlineValueFilter as FV } from '../ValueFilter'
import { VennFilter } from '../../common/Persona'
import { RotateContent } from '../RotateContent'
import { Video } from '../Video'
import ReactResizeDetector, { useResizeDetector } from 'react-resize-detector'
import { useTip } from '../Tip'
import { UsePersona } from '../../common/Persona'
import { SelectWithChannelSearch } from './SelectWithChannelSearch'
import { useWindowDim } from '../../common/Window'

export const PersonaStoryVenn = ({ chans, recState, personaMd, setQuery, hideFilters }:
  Pick<UsePersona, 'chans' | 'recState' | 'personaMd'> & {
    setQuery?: (value: VennFilter) => void,
    hideFilters?: boolean
  }) => {

  const vennFilterProps = { metadata: personaMd, rows: recState?.recs }
  const chanTip = useTip<Channel>()
  const fromVideoCount = recState?.fromVideos?.length
  const windowDim = useWindowDim()
  const { ref: venRef, width: venWidth } = useResizeDetector({ skipOnMount: true })

  return useMemo(() =>
    //console.log('PersonaStoryVenn', { chans: chans && keys(chans).length, recState: recState?.recs.length, videos: recState?.fromVideos })
    <><NarrowSection style={{ display: hideFilters ? 'none' : null }}>
      <FH>
        <FP>Recommendations seen by personas <FV metadata={personaMd}
          filter={{ groupAccounts: recState?.filter.vennAccounts }}
          onFilter={f => setQuery({ vennAccounts: f.groupAccounts })}
          rows={recState?.groups} />
        </FP>

        {chans && recState && <FP>from channel
          <SelectWithChannelSearch ids={recState?.filter.vennChannelIds}
            onSelect={ids => setQuery?.({ vennChannelIds: ids?.length ? ids : undefined })}
            channels={chans}
            style={{ marginLeft: '1em' }} />
          {recState.availableChannelIds?.length > 0 && <FP><button
            style={{ ...styles.centerH, display: 'block' }}
            onClick={() => {
              return setQuery?.({ vennChannelIds: [takeRandom(recState.availableChannelIds)], vennLabel: 'Other', vennDay: null })
            }}
          >Random</button></FP>}
        </FP>}
        <FP>on <FV {...vennFilterProps} filter={{ day: recState?.filter?.vennDay }}
          onFilter={f => setQuery?.({ vennDay: f.day })} /></FP>
      </FH>
    </NarrowSection>
      {recState?.fromVideos && <FlexCenter style={{ margin: '0 1em', padding: '1em' }}>
        <div>
          <RotateContent
            data={recState.fromVideos}
            getDelay={() => 4000 + Math.random() * 1000}
            style={{ maxWidth: '100%', height: '10em' }}
            template={(v) => {
              if (!v)
                return
              const c = chans?.[v.channelId] ?? { channelId: v.channelId, channelTitle: v.channelTitle }
              return <Video v={v} c={c} showThumb showChannel useTip={chanTip} thumbStyle={{ height: '8em', width: '14em', objectFit: 'cover' }} />
            }} />
          <p style={{ visibility: fromVideoCount > 1 ? null : 'hidden' }}>recommendations from <b>{numFormat(fromVideoCount)}</b> videos</p>
        </div>
      </FlexCenter>}

      <FlexCenter style={{ width: '100%' }} ref={venRef}>
        <PersonaVenn
          channels={chans}
          sets={recState?.sets}
          width={venWidth ?? 200}
          height={Math.max(windowDim.h - 250, 400)}
          videos={recState?.byId} />
      </FlexCenter>
    </>
    , [recState, chans, personaMd, windowDim.w, venWidth])
}



