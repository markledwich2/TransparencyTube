import React, { useEffect, useState } from 'react'
import { GlobalStyle, MinimalPage } from '../../components/Style'
import { VaccineVideo } from '../../components/pendulum/VaccineVideo'

const ReportPage = () => <>
  <GlobalStyle />
  <MinimalPage>
    <VaccineVideo />
  </MinimalPage>
</>


export default ReportPage