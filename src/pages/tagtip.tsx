import React, { useEffect, useState } from 'react'
import { Channel, channelMd, getChannels } from '../common/Channel'
import Layout from '../components/Layout'
import { TagHelp, TagInfo, TagTip } from '../components/TagInfo'

const TagTipPage = () => {
  const [channels, setChannels] = useState<Channel[]>()

  useEffect(() => { getChannels().then((chans) => setChannels(chans)) }, [])

  return <Layout>
    <TagHelp tag='SocialJustice' />
    <TagTip channels={channels} />
    {channelMd.tags.values.map(t => <TagInfo key={t.value} tag={t.value} channels={channels} />)}
  </Layout>
}

export default TagTipPage