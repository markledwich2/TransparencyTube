import React from 'react'
import styled from 'styled-components'
import { FlexRow } from './Layout'
import { Twitter } from '@styled-icons/boxicons-logos'
import { Email } from '@styled-icons/entypo'

const FooterStyle = styled.div`
  background-color:var(--bg1);
  display:flex;
  flex-direction:row;
  flex-flow:wrap;
  padding: 5em 3em;
  color: var(--fg3);
  > * {
    padding-right: 4em;
    flex: 1
  }

  li {
    list-style-type: none;
    line-height:1.6em;
  }
`

export const Footer = () => <FooterStyle>
  <ContactCard name="Mark Ledwich" email="mark@ledwich.com.au" role="data viz &amp; collection" twitter="mark_ledwich" />
  <ContactCard name="Sam Clark" email="sclark.uw@gmail.com" role=" automated channel discovery &amp; classification" twitter="samuel_clark" />
  <div>
    <b>Source</b>
    <ul>
      <li><a href='https://github.com/sam-clark/chan2vec#chan2vec'>chan2vec</a> - Channel discovery &amp; automatic classification</li>
      <li><a href='https://github.com/markledwich2/Recfluence'>Recfluence</a> - Data collection &amp; classification details</li>
      <li><a href='https://github.com/markledwich2/Recfluence'>Transparency.tube</a>- This website</li>
    </ul>
  </div>
</FooterStyle>

interface ContactInfo {
  name: string
  email: string
  twitter: string
  role: string
}
export const ContactCard = ({ name, email, role, twitter }: ContactInfo) => <div>
  <b>{name}</b>
  <ul>
    <li>{role}</li>
    <li><Email /><a href={`mailto:${email}`}>{email}</a></li>
    <li><Twitter /><a href={`https://twitter.com/${twitter}`}>{twitter}</a></li>
  </ul>
</div>