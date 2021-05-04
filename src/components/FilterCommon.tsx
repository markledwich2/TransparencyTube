import styled from 'styled-components'

export const FilterHeader = styled.span`
  font-size: 1.1em;
  font-weight: bold;
  line-height:2em;
  margin-bottom:1em;
  display: flex;
  flex-wrap: wrap;
  align-items: center; 
`

export const FilterPart = styled.span`
  white-space:nowrap;
  margin-right:0.5em;
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  > * {
    margin-right:0.5em;
  }
`