import React, { useEffect, useState } from 'react'
import { GlobalStyle, MinimalPage } from '../../components/Style'
import { NarrativeVideoComponent } from '../../components/pendulum/NarrativeVideo'
import { NarrativeHighlightComponent } from '../../components/pendulum/NarrativeHighlight'

const ReportPage = () => <>
  <GlobalStyle />
  <MinimalPage>
    <NarrativeVideoComponent narrative='Vaccine DNA' />
    <NarrativeHighlightComponent narrative='Vaccine DNA' />
  </MinimalPage>
</>


export default ReportPage