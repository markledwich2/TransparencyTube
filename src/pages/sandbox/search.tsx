import React, { useEffect, useState } from 'react'
import { sortBy } from 'remeda'
import { Channel, getChannels } from '../../common/Channel'
import { ChannelTitle } from '../../components/Channel'
import Layout from '../../components/Layout'
import { SearchSelect } from '../../components/SearchSelect'

const SearchSandbox = () => {
  const [channels, setChannels] = useState<Channel[]>()
  useEffect(() => { getChannels().then((chans) => setChannels(chans)) }, [])

  const [channel, setChannel] = useState<Channel>()

  return <Layout>
    <SearchSelect
      onSelect={(c: Channel) => setChannel(c)}
      search={(q) => new Promise((resolve) => resolve(
        sortBy(
          channels?.filter(f => f.channelTitle.search(new RegExp(`${q}`, 'i')) > 0),
          [c => c.channelViews, 'desc'])
      ))}
      itemRender={(c: Channel) => <ChannelTitle c={c} />}
      getKey={c => c.channelId}
      getLabel={c => c.channelTitle}
    />
    <h3>{channel?.channelTitle}</h3>
  </Layout>
}

export default SearchSandbox