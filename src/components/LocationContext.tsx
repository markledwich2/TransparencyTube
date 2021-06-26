
import React, { useEffect, FunctionComponent as FC, useContext, createContext } from 'react'
export type LocationType = 'reach' | 'window'
interface LocationCtx { locationMode: LocationType }

// depending on which site/api we are displaying components, we need to switch between reach routing and raw window location. Main use is by QueryString.ts
export const LocationContext = createContext<LocationCtx>({ locationMode: 'reach' })
export const LocationProvider: FC<LocationCtx> = ({ children, ...ctx }) => <LocationContext.Provider value={ctx} children={children} />


