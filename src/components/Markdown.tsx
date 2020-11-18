import React, { PropsWithChildren } from 'react'
import ReactMarkdown, { ReactMarkdownProps } from 'react-markdown'
import styled from 'styled-components'


export const TextStyle = styled.div`
  font-size: 1.4rem;
  line-height:1.5em;
  white-space:normal;
  p {
    margin: 0.1em 0 0.4em 0;
  }

  h1, h2, h3 {
    margin: 1em 0;
  }

  ul {
    line-height:1.2em;
    
    color:var(--fg2);
    list-style:disc;
    list-style-position: inside;
    white-space: normal;
    word-break: normal;
    li {
      margin:0.5em 0;
    }
  }

  code, inlineCode  {
      font-family:monospace;
      background-color:var(--bg2);
      padding: 0.1em 0.2em;
      border: 1px solid var(--bg3);
      border-radius: 5px;
  }
`

export const TextSection = styled(TextStyle)`
  width: 50em;
  max-width: 100%;
  margin:auto;
`

export const Markdown = (props: PropsWithChildren<ReactMarkdownProps>) => <TextStyle as={ReactMarkdown} {...props} />