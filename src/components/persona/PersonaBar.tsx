import React, { CSSProperties, FunctionComponent as FC, ReactNode } from 'react'
import ContainerDimensions from 'react-container-dimensions'
import styled from 'styled-components'
import { Tag } from '../Channel'
import { FlexCol, FlexRow, StyleProps, styles } from '../Style'
import ReactMarkdown from 'react-markdown'
import { UserCircle } from '@styled-icons/boxicons-solid'
import { StyledIcon } from '@styled-icons/styled-icon'
import { BarStat, BarFilter, layoutCharts, tagMd, usePersonaBar, barMd } from './PersonaBarUse'
import { groupMap } from '../../common/Pipe'


export const PersonaBar: FC<{ filter: BarFilter, colPanelStyle?: CSSProperties, noLoad?: boolean } & StyleProps> = ({ filter, style, colPanelStyle, noLoad }) => {
  const { cfg, stats, statsFiltered } = usePersonaBar(filter, noLoad)

  return <div className='bar' style={{ font: cfg.font, ...style }}>
    <ContainerDimensions >
      {({ width }) => {
        const charts = stats && layoutCharts(stats, statsFiltered, { width, font: cfg.font })
        return <div>
          {charts && groupMap(charts, c => c.source, (charts, source, sourceIdx) => {
            const multiAccount = charts.length > 1
            return <div key={source ?? '_'}>
              <h3 style={{ marginTop: '1em' }}>{barMd.source[source]}</h3>
              {charts.map(({ legend, charts, account }, groupIdx) => <div style={{ marginTop: '1em' }}>
                <AccountTag account={account} style={{ fontSize: multiAccount ? '1em' : '1.2em' }} />
                <FlexRow>
                  <Panel title={groupIdx + sourceIdx == 0 ? 'Recommended video tag' : null}>
                    <SvgStyle height={legend.bounds.h} width={legend.bounds.w}>
                      <symbol id='video-icon'>
                        <path transform='scale(0.035)' d="M480,64v32h-64V64H96v32H32V64H0v384h32v-32h64v32h320v-32h64v32h32V64H480z M96,352H32v-64h64V352z M96,224H32v-64h64V224z
         M480,352h-64v-64h64V352z M480,224h-64v-64h64V224z"/>
                      </symbol>
                      <g style={{ font: legend.cfg.labelFont }}>
                        {legend.items.map(l => {
                          const r = l.rect
                          return <g transform={`translate(${r.x}, ${r.y})`} key={l.tag}>
                            <rect rx={5} width={r.w ?? 0} height={r.h} style={{ fill: r.fill }}></rect>
                            <use xlinkHref='#video-icon' x={r.w - legend.cfg.iconWidth - 3} y={5} />
                            <text className='tag' x={10} y={r.h - 6}>{l.label}</text>
                          </g>
                        })}
                      </g>
                    </SvgStyle>
                  </Panel>
                  <FlexRow style={{ overflowX: 'auto' }}>
                    {charts.map((c, i) => <Panel key={i} title={groupIdx + sourceIdx == 0 ? c.title : null} style={colPanelStyle}>
                      <SvgStyle height={c.h} width={c.w}>
                        <g style={{ font: legend.cfg.labelFont }} transform={`translate(${c.x}, ${c.y})`} >
                          {c.lines.map((l, i) => <line key={i} {...l} className="tick" />)}
                          {c.bars.map(b => <rect key={b.row.toTag} width={b.w} height={b.h}
                            x={b.x} y={b.y}
                            style={{ fill: b.color }}></rect>)}
                          {c.labels.map((l, i) => <text key={l.row.toTag}
                            className={`label ${l.inside ? 'inside' : 'outside'}`}
                            data-tag={l.row.toTag}
                            x={l.x} y={l.y}>{l.label}</text>)}
                        </g>
                      </SvgStyle>
                    </Panel>)}
                  </FlexRow>
                </FlexRow>
              </div>)}
            </div>
          })}
        </div>
      }}
    </ContainerDimensions>
  </div>
}
export default PersonaBar

const PanelStyle = styled.div`
  height: 4em;
  overflow:hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  > * {
    text-align: center;
  }
`

const Panel: FC<StyleProps & { title: string }> = ({ title, children, style }) => <FlexCol style={style}>
  {title && <PanelStyle><ReactMarkdown>{title}</ReactMarkdown></PanelStyle>}
  <div>{children}</div>
</FlexCol>

const SvgStyle = styled.svg`
  text.tag, path {
      fill:#ddd;
  }

  text.label {
    fill:var(--fg1);
    &.inside {
      fill:#ddd;
    }
  }

  line.tick {
    stroke: var(--bg4);
    stroke-width: 1px;
  }
`

export const AccountTag: FC<{ account: string, icon?: StyledIcon, noIcon?: boolean } & StyleProps> =
  ({ account, style, icon: Icon, noIcon }) => {
    const accountMd = tagMd[account]
    const iconStyle = { ...styles.inlineIcon, marginLeft: '0.6em' }
    Icon ??= UserCircle
    return <Tag color={accountMd?.color} style={style}>
      {accountMd?.label ?? account}{!noIcon && <Icon style={iconStyle} />}
    </Tag>
  }
