import React from 'react'
import styled from 'styled-components'


const FooterStyle = styled.div`
  background-color:var(--bg1);
  display:flex;
  flex-direction:row;
  flex-flow:wrap;
  padding: 5em 3em;
  color: var(--fg3);
  > * {
    padding: 2em;
    flex: 1;
  }

  ul {
    li {
      list-style-type: none;
      line-height:1.6em;
    }  
  }
`


export const Footer = () => <FooterStyle>
  <div>
    <b>Source</b>
    <ul>
      <li><a href='https://github.com/sam-clark/chan2vec#chan2vec'>chan2vec</a> - Channel discovery &amp; automatic classification</li>
      <li><a href='https://github.com/markledwich2/Recfluence'>Recfluence</a> - Data collection &amp; classification details</li>
      <li><a href='https://github.com/markledwich2/Recfluence'>Transparency.tube</a>- This website</li>
    </ul>
  </div>
</FooterStyle>

