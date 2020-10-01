import React, { useState, useEffect, FunctionComponent, useContext } from 'react'
import { Channel } from '../common/Channel'

const InteractionCtx = React.createContext<Interaction>(null)
interface Interaction { hover?: VideoHover }
interface VideoHover {
  col: keyof Channel
  value: string
}

const InteractionCtxProvider: FunctionComponent<{}> = ({ children }) =>
  <InteractionCtx.Provider value={{ hover: null }} children={children} />
