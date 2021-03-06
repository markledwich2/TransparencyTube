import React from "react"
import { Footer } from '../components/Footer'
import Layout from "../components/Layout"
import SEO from '../components/SEO'
import { FlexRow, styles, TextPage } from '../components/Style'
import { Twitter } from '@styled-icons/boxicons-logos'
import { Email } from '@styled-icons/entypo'
import styled from 'styled-components'

const ContactPage = () => <Layout>
  <TextPage>
    <h2>Contact</h2>
    <ContactCard name="Transparency.tube" email="hello@transparency.tube" role="Media &amp; General inquiries" twitter="transparency_tb" />
    <ContactCard
      name="Mark Ledwich" email="mark@ledwich.com.au"
      role="Data processing, data-viz, channel classification, YouTube scraping"
      twitter="mark_ledwich" />
    <ContactCard
      name="Sam Clark" email="sclark.uw@gmail.com"
      role="Automated channel discovery &amp; classification, narrative analysis"
      twitter="samuel_clark" />
  </TextPage>
  <Footer />
</Layout>
export default ContactPage


const StyledContact = styled.div`
  margin-bottom:1em;
  ul {
    list-style: none;
    li {
      line-height:1.5em;
    }
  }
`

const iconStyle = { ...styles.inlineIcon, color: 'var(--bg3)' }

interface ContactInfo {
  name: string
  email: string
  twitter: string
  role: string
}
export const ContactCard = ({ name, email, role, twitter }: ContactInfo) => <StyledContact>
  <h3>{name}</h3>
  <ul>
    <li>{role}</li>
    <li><Email style={iconStyle} /><a href={`mailto:${email}`}>{email}</a></li>
    <li><Twitter style={iconStyle} /><a href={`https://twitter.com/${twitter}`}>{twitter}</a></li>
  </ul>
</StyledContact>