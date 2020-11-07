import React, { PropsWithChildren } from 'react'
import styled from 'styled-components'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import Modal from 'react-modal'

export const popupClasses = {
  popup: 'popup-main',
  overlay: 'popup-overlay'
}

const Close = styled(CloseOutline)`
  position: absolute;
  right: 0.5em;
  top: 0.5em;
  height: 3em;
  :hover {
    cursor: pointer;
  }
`

export const Popup = (props: PropsWithChildren<ReactModal.Props>) => {
  const { className, ...passProps } = props
  return <Modal
    ariaHideApp={false}
    parentSelector={() => document.querySelector('#main')}
    overlayClassName={popupClasses.overlay}
    className={popupClasses.popup}
    shouldCloseOnEsc={true}
    shouldCloseOnOverlayClick={true}
    {...passProps}
  >
    <>
      <Close onClick={e => props.onRequestClose?.(e)} />
      {props.children}
    </>
  </Modal>
}