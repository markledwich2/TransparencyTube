import React, { } from 'react'
import { GlobalStyle, MinimalPage } from '../../components/Style'
import { NarrativeVideoComponent } from '../../components/pendulum/NarrativeVideo'
import { Router, RouteComponentProps } from '@gatsbyjs/reach-router'


const ReportPage = () => <>
  <GlobalStyle />
  <MinimalPage>
    <Router >
      <NarrativeVideoComponent path="sandbox/narrative/:narrative" />
      <BlankPage path="sandbox/narrative" default />
    </Router>
  </MinimalPage>
</>

export default ReportPage

const BlankPage = (props: RouteComponentProps<{}>) => <div></div>