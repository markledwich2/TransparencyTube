
import React, { PropsWithChildren, useState } from 'react'
import styled from 'styled-components'

const StyledBurger = styled.div<{ open: boolean }>`
  width: 2rem;
  height: 2rem;
  position: absolute;
  top: 22px;
  right: 15px;
  z-index: 20;
  display: none;
  @media (max-width: 768px) {
    display: flex;
    justify-content: space-around;
    flex-flow: column nowrap;
  }
  div {
    width: 2rem;
    height: 0.25rem;
    background-color: ${({ open }) => open ? 'var(--fg)' : 'var(--bg3)'};
    border-radius: 10px;
    transform-origin: 1px;
    transition: all 0.1s linear;
    &:nth-child(1) {
      transform: ${({ open }) => open ? 'rotate(45deg)' : 'rotate(0)'};
    }
    &:nth-child(2) {
      transform: ${({ open }) => open ? 'translateX(100%)' : 'translateX(0)'};
      opacity: ${({ open }) => open ? 0 : 1};
    }
    &:nth-child(3) {
      transform: ${({ open }) => open ? 'rotate(-45deg)' : 'rotate(0)'};
    }
  }
`

export const Burger = ({ children }: PropsWithChildren<{}>) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <StyledBurger open={open} onClick={() => setOpen(!open)}>
        <div />
        <div />
        <div />
      </StyledBurger>
      <RightNav open={open} children={children} />
    </>
  )
}

const MenuDiv = styled.div<{ open: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  a {
    padding: 18px 10px;
    &.open-only {
      display:${({ open }) => open ? 'block' : 'none'};
    }
  }

   
  @media (max-width: 768px) {
    flex-flow: column nowrap;
    background-color: var(--bg1);
    position: fixed;
    transform: ${({ open }) => open ? 'translateX(0)' : 'translateX(100%)'};
    box-shadow:${({ open }) => open ? '-5px 0px 20px rgba(0, 0, 0, 0.2)' : 'none'};
    top: 0;
    right: 0;
    height: 100vh;
    width: 300px;
    padding-top: 3.5rem;
    transition: transform 0.1s ease-in-out;
    z-index: 5;
  }
`

const RightNav = ({ open, children }: PropsWithChildren<{ open: boolean }>) => {
  return (
    <MenuDiv open={open}>
      {children}
    </MenuDiv>
  )
}


const Nav = styled.nav`
  width: 100%;
  height: 55px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  .logo {
    padding: 15px 0;
  }
`

const Navbar = () => <Nav>
  <div className="logo">
    Nav Bar
      </div>
  <Burger />
</Nav>
