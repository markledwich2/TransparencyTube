import React, { CSSProperties, FC, PropsWithChildren, ReactElement, ReactNode, useState } from 'react'
import { compact, first, indexBy } from 'remeda'
import styled from 'styled-components'
import { values } from '../common/Pipe'
import { FlexRow, StyleProps } from './Style'

const TabsStyle = styled(FlexRow)`
  margin-bottom:1em;
`

const TabA = styled.a`
  font-size:1.3em;
  font-weight:bold;
  margin-right:1em;
  color:var(--fg1);
  :hover {
    color:var(--fg-feature);
  }
  &.selected {
    border-bottom: 4px solid var(--bg-feature);
  }
`

interface TabsProps { children: ReactElement[], titleStyle?: CSSProperties }
export const Tabs = ({ children, titleStyle }: TabsProps) => {
  const [selectedTab, setSelectedTab] = useState<number>(0)
  return <>
    <TabsStyle>
      {children.map((c, i) => <TabTitle
        key={i}
        className={selectedTab == i && 'selected'}
        style={titleStyle}
        label={c.props.label}
        onClick={() => setSelectedTab(i)} />)}
    </TabsStyle>
    {children[selectedTab]?.props.children}
  </>
}

//const isTab = (c: ReactNode): c is ReactElement<TabProps> => (c as ReactElement<TabProps>).props.label != undefined

interface TabTitleProps {
  label: string
  onClick: () => void
}
export const TabTitle: FC<TabTitleProps & StyleProps> = ({ label, onClick, className, style }) =>
  <TabA className={className} style={style} onClick={() => onClick()}>{label}</TabA>

interface TabProps { label: string }
export const Tab: FC<StyleProps & TabProps> = ({ children, style, label }) => <div style={style}>{children}</div>