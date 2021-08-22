import React, { ReactNode, useMemo, CSSProperties } from 'react'
import { groupBy, indexBy, mapValues, sortBy, uniq } from 'remeda'
import styled from 'styled-components'
import { FilterKeys } from '../common/Types'

/** A bare bones pivot table that takes pre-aggregated data in row form (i.e. SQL group by not pivot) */
export const PivTable = <T extends object,>({ rows, rowGroup, colGroup, colHeader, rowHeader, cell, cellStyle }: {
  rows: T[],
  rowGroup: FilterKeys<T, string>,
  colGroup: FilterKeys<T, string>,
  colHeader: (group: string) => ReactNode,
  rowHeader: (group: string) => ReactNode,
  cell: (row: T) => ReactNode,
  cellStyle?: (row: T) => CSSProperties
}) => {

  const { colGroupVals, rowGroupVals, getRow } = useMemo(() => {
    const getColGroup = (r: T) => r[colGroup] as any as string // method to encapsulate this typing issue
    const getRowGroup = (r: T) => r[rowGroup] as any as string
    const groupVals = (getGroup: (r: T) => string) => rows ? sortBy(uniq(rows.map(getGroup)), g => g == 'Non-political' ? 'z' : g) : []
    const colGroupVals = groupVals(getColGroup)
    const rowGroupVals = groupVals(getRowGroup)
    const byRowCol = rows && mapValues(groupBy(rows, getRowGroup), colRows => indexBy(colRows, getColGroup))
    const getRow = (rowVal: string, colVal: string) => byRowCol?.[rowVal]?.[colVal]
    return { colGroupVals, rowGroupVals, getRow }
  }, [rows])

  return <StyledTable>
    <thead>
      <tr>
        <th></th>
        {colGroupVals?.map(c => <th key={c}>{colHeader(c)}</th>)}
      </tr>
    </thead>
    <tbody>
      {rowGroupVals?.map(rg => <tr key={rg}>
        <th>{rowHeader(rg)}</th>
        {colGroupVals?.map(cg => {
          const r = getRow(rg, cg)
          return <td key={cg} style={cellStyle?.(r)}>{r && cell(r)}</td>
        })}
      </tr>)}
    </tbody>
  </StyledTable>
}


const StyledTable = styled.table`
  border-spacing: 0;
  thead th {
    vertical-align: bottom;
  }
  tbody {
    th {
      text-align: right;
    }
    td {
      text-align: center;
      padding: 0px;
    }
  }
`
