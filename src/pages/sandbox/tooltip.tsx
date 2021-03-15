import React, { FunctionComponent as FC } from 'react'
import Layout from '../../components/Layout'
import { FlexRow } from '../../components/Style'
import { Tip, useTip } from '../../components/Tip'

const TipTest: FC<{}> = () => {
  const tip = useTip()

  return <Layout >
    <div style={{ marginBottom: '20vh', padding: '1em', border: '1px solid var(--bg3)' }}>stuff above</div>

    <div style={{ border: '1px solid red', position: 'relative', padding: '2em' }} >
      Container of tip. Always use position: 'relative'

      <FlexRow style={{ flexWrap: 'wrap' }}>
        {['matt', 'mark', 'luke', 'john', 'mary', 'jane', 'doh', 'farm', 'baby'].map((name) => <div
          onMouseEnter={e => {
            tip.showTip(e.currentTarget, name)
          }}
          onMouseLeave={() => {
            tip.hideTip()
          }}
          style={{ width: '10em', height: '10em', backgroundColor: 'blue' }}>{name}</div>)}
      </FlexRow>

      <Tip {...{ ...tip.tipProps, open: true }} >
        Data value <strong>{tip.data}</strong> and other longer pieces of text
      </Tip>
    </div>

    <div style={{ marginBottom: '100vh', padding: '1em', }}>stuff below</div>
  </Layout>
}

export default TipTest
