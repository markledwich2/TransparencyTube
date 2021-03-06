import React, { PropsWithChildren } from 'react'
import styled from 'styled-components'
import { CloseOutline } from '@styled-icons/evaicons-outline'
import Modal from 'react-modal'

export const popupClasses = {
  popup: 'popup-main',
  overlay: 'popup-overlay',
  content: 'popup-content'
}

export const Close = styled(CloseOutline)`
  position: absolute;
  right: 0.5em;
  top: 0.5em;
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
      <div className={popupClasses.content}>
        {props.children}
      </div>
      <Close onClick={e => props.onRequestClose?.(e)} style={{ width: '30px', height: '30px' }} />
    </>
  </Modal>
}