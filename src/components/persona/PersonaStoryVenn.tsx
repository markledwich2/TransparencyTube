
import React, { } from 'react'
import { FlexRow, NarrowSection, styles } from '../Style'
import { Channel } from '../../common/Channel'
import { PersonaVenn } from './PersonaVenn'
import { takeRandom } from '../../common/Pipe'
import { numFormat } from '../../common/Utils'
import { FilterHeader as FH, FilterPart as FP } from '../FilterCommon'
import { InlineValueFilter as FV } from '../ValueFilter'
import { VennFilter } from '../../common/Persona'
import { RotateContent } from '../RotateContent'
import { Video } from '../Video'
import ContainerDimensions from 'react-container-dimensions'
import { useTip } from '../Tip'
import { UsePersona } from '../../common/Persona'
import { SelectWithChannelSearch } from './SelectWithChannelSearch'

export const PersonaStoryVenn = ({ chans, recState, personaMd, setQuery, hideFilters }:
  Pick<UsePersona, 'chans' | 'recState' | 'personaMd'> & {
    setQuery?: (value: VennFilter) => void,
    hideFilters?: boolean
  }) => {

  const vennFilterProps = { metadata: personaMd, rows: recState?.recs }
  const chanTip = useTip<Channel>()
  const fromVideoCount = recState?.fromVideos?.length

  return <><NarrowSection style={{ visibility: hideFilters ? 'hidden' : null }}>
    <FH>
      <FP>Recommendations seen by personas <FV metadata={personaMd}
        filter={{ groupAccounts: recState?.filter.vennAccounts }}
        onFilter={f => setQuery({ vennAccounts: f.groupAccounts })}
        rows={recState?.groups} />
      </FP>
      {/* <FP>
        in video collection <FV {...vennFilterProps} filter={{ label: recState?.filter?.vennLabel }} onFilter={f => setQuery({ vennLabel: f.label })} />
      </FP> */}
      {chans && <FP>from channel
        <SelectWithChannelSearch ids={recState?.filter.vennChannelIds}
          onSelect={ids => setQuery?.({ vennChannelIds: ids?.length ? ids : undefined })}
          channels={chans}
          style={{ marginLeft: '1em' }} />
        {recState.availableChannelIds && <FP><button
          style={{ ...styles.centerH, display: 'block' }}
          onClick={() => setQuery?.({ vennChannelIds: [takeRandom(recState.availableChannelIds)], vennLabel: undefined, vennDay: undefined })}
        >Random</button></FP>}
      </FP>}
      <FP>on <FV {...vennFilterProps} filter={{ day: recState?.filter?.vennDay }}
        onFilter={f => setQuery?.({ vennDay: f.day })} /></FP>
    </FH>
  </NarrowSection>

    {recState?.fromVideos && <FlexRow style={{ marginBottom: '1em', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <RotateContent
          data={recState.fromVideos}
          getDelay={() => 4000 + Math.random() * 1000}
          style={{ maxWidth: '100%' }}
          template={(v) => {
            if (!v)
              return
            const c = chans?.[v.channelId] ?? { channelId: v.channelId, channelTitle: v.channelTitle }
            return <Video v={v} c={c} showThumb showChannel useTip={chanTip} />
          }} />
        <p style={{ visibility: fromVideoCount > 1 ? null : 'hidden' }}>recommendations from <b>{numFormat(fromVideoCount)}</b> videos</p>
      </div>
    </FlexRow>}

    <div style={{ width: '100%', height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <ContainerDimensions>
        {({ width, height }) => {
          return <PersonaVenn channels={chans} sets={recState?.sets} width={width} height={height} videos={recState?.byId} />
        }}
      </ContainerDimensions>
    </div>
  </>
}



