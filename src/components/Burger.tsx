
import React, { PropsWithChildren, useState } from 'react'
import styled from 'styled-components'
import { MenuOutline } from '@styled-icons/evaicons-outline'
import { Close } from './Popup'

const StyledBurger = styled(MenuOutline) <{ open: boolean, collapseWidth: string }>`
  width: 2rem;
  height: 2rem;
  position: absolute;
  top: 15px;
  right: 15px;
  display: none;
  @media (max-width: ${p => p.collapseWidth}) {
    display: block;
  }
`

export const Burger = ({ children, collapseWidth }: PropsWithChildren<{ collapseWidth: string }>) => {
  const [open, setOpen] = useState(false)
  return <>
    <StyledBurger collapseWidth={collapseWidth} open={open} onClick={() => setOpen(!open)} />
    <RightNav open={open} children={children} setOpen={setOpen} />
  </>
}

const MenuDiv = styled.div<{ open: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  a {
    margin: 0.8em 0.7em;
    &.open-only {
      display:${({ open }) => open ? 'block' : 'none'};
    }
  }

  @media (max-width: 768px) {
    display: ${({ open }) => open ? 'flex' : 'none'};
    flex-flow: column nowrap;
    background-color: var(--bg1);
    position: fixed;
    box-shadow:${({ open }) => open ? '-5px 0px 20px rgba(0, 0, 0, 0.2)' : 'none'};
    top: 0;
    right: 0;
    height: 100vh;
    width: 300px;
    padding-top: 3.5rem;
    z-index: 4;
  }
`

const RightNav = ({ open, children, setOpen }: PropsWithChildren<{ open: boolean, setOpen: (open: boolean) => void }>) => {
  return (
    <MenuDiv open={open}>
      <Close onClick={() => setOpen(false)} style={{ display: open ? null : 'none' }} />
      {children}
    </MenuDiv>
  )
}

