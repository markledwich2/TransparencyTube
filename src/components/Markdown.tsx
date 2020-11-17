import React from 'react'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'


export const TextSection = styled.div`
  font-size: 1.2rem;
  width: 100%;
  white-space:normal;

  p {
    line-height:1.2em;
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
  }
`

export const Markdown = styled(ReactMarkdown)`
  width: 100%;
  white-space:normal;

  p {
    line-height:1.2em;
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
  }

  code, inlineCode  {
      font-family:monospace;
      background-color:var(--bg2);
      padding: 0.1em 0.2em;
      border: 1px solid var(--bg3);
      border-radius: 5px;
  }
`