import React, { PropsWithChildren } from 'react'
import ReactMarkdown, { ReactMarkdownProps } from 'react-markdown'
import styled from 'styled-components'


export const TextStyle = styled.div`
  line-height:1.5em;
  white-space:normal;
  p {
    margin: 0.2em 0 0.7em 0;
  }

  h1, h2, h3 {
    margin: 1em 0 0.5em;
  }

  ul {
    color:var(--fg2);
    list-style:disc;
    list-style-position: outside;
    margin-left: 1em;
    white-space: normal;
    word-break: normal;
    li {
      margin:0.4em 0;
    }
  }

  code, inlineCode  {
      font-family:monospace;
      background-color:var(--bg2);
      padding: 0.1em 0.2em;
      border: 1px solid var(--bg3);
      border-radius: 5px;
  }

  img {
    width: 100%
  }
`

export const TextSection = styled(TextStyle)`
  margin:auto;
  font-size: 1.4rem;
  max-width: 45em;
`

export const Markdown = (props: PropsWithChildren<ReactMarkdownProps>) => <TextStyle as={ReactMarkdown} {...props} />