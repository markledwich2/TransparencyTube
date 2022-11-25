import React, { CSSProperties, FunctionComponent as FC, ReactNode } from 'react'
import ReactResizeDetector from 'react-resize-detector'
import styled from 'styled-components'
import { Tag } from '../Channel'
import { FlexCol, FlexRow, StyleProps, styles } from '../Style'
import ReactMarkdown from 'react-markdown'
import { UserCircle } from '@styled-icons/boxicons-solid'
import { StyledIcon } from '@styled-icons/styled-icon'
import { RecStat, RecStatFilter, layoutCharts, tagMd, usePersonaBar, barMd } from './PersonaBarUse'
import { groupMap } from '../../common/Pipe'
import { UseTip } from '../Tip'
import { Markdown } from '../Markdown'


export const PersonaBar: FC<{ filter: RecStatFilter, colPanelStyle?: CSSProperties, noLoad?: boolean, accountTip?: UseTip<string>, videoTip?: UseTip<string> } & StyleProps> =
  ({ filter, style, colPanelStyle, noLoad, accountTip, videoTip }) => {
    const { cfg, stats, statsFiltered } = usePersonaBar(filter, noLoad)

    return <div className='bar' style={{ font: cfg.font, ...style }}>
      <ReactResizeDetector >
        {({ width }) => {
          const charts = stats && layoutCharts(stats, statsFiltered, { width, font: cfg.font })
          return <div>
            {charts && groupMap(charts, c => c.source ?? '_', (charts, source, sourceIdx) => {
              const multiAccount = charts.length > 1
              return <div key={source ?? '_'}>
                <h3 style={{ marginTop: '1em' }}>{barMd.source[source].title}</h3>
                {charts.map(({ legend, charts, account, emInPx }, groupIdx) => <div key={account} style={{ marginTop: '1em' }}>
                  <AccountTag account={account} style={{ fontSize: multiAccount ? '1em' : '1.2em' }} accountTip={accountTip} />
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
                              <rect rx={5} width={r.w ?? 0} height={r.h} style={{ fill: r.fill }} {...videoTip?.eventProps(l.tag)}></rect>
                              <text className='tag' x={10} y={r.h - emInPx * 0.5} {...videoTip?.eventProps(l.tag)}>{l.label}</text>
                            </g>
                          })}
                        </g>
                      </SvgStyle>
                    </Panel>
                    <FlexRow style={{}}>
                      {charts.map((c, i) => <Panel key={i} title={groupIdx + sourceIdx == 0 ? c.shortTitle : null} style={colPanelStyle}>
                        <SvgStyle height={c.h} width={c.w}>
                          <g style={{ font: legend.cfg.labelFont }} transform={`translate(${c.x}, ${c.y})`} >
                            {c.lines.map((l, i) => <line key={i} {...l} className="tick" />)}
                            {c.bars.map(b => <rect key={b.row.toTag} width={b.w} height={b.h}
                              x={b.x} y={b.y}
                              style={{ fill: b.color }}></rect>)}
                            {c.labels.map((l, i) => <text key={l.row.toTag}
                              className={`label ${l.inside ? 'inside' : 'outside'}`}
                              data-tag={l.row.toTag}
                              x={l.x} y={l.yMiddle}
                              dominantBaseline='central'
                            >{l.label}</text>)}
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
      </ReactResizeDetector>
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

export const AccountTag: FC<{ account: string, icon?: StyledIcon, noIcon?: boolean, accountTip?: UseTip<string> } & StyleProps> =
  ({ account, style, icon: Icon, noIcon, className, accountTip }) => {
    const accountMd = tagMd[account]
    const iconStyle = { ...styles.inlineIcon, marginLeft: '0.6em' }
    Icon ??= UserCircle
    return <span {...accountTip?.eventProps(account)}><Tag {...{ className, style }} color={accountMd?.color}>
      {accountMd?.label ?? account}{!noIcon && <Icon style={iconStyle} />}
    </Tag></span>
  }

export const AccountTip: FC<{ account }> = ({ account }) => <Markdown style={{ maxWidth: '30em' }}>{tagMd[account]?.desc}</Markdown>
