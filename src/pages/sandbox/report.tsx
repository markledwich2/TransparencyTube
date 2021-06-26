import React, { useEffect, useState } from 'react'
import { GlobalStyle, MinimalPage } from '../../components/Style'
import { NarrativeVideoComponent } from '../../components/pendulum/NarrativeVideo'
import { NarrativeHighlightComponent } from '../../components/pendulum/NarrativeHighlight'
import { narrativeProps } from '../../common/Narrative'

const ReportPage = () => <>
  <GlobalStyle />
  <MinimalPage>
    <NarrativeVideoComponent {...narrativeProps.comcast} />
  </MinimalPage>
</>

export default ReportPage