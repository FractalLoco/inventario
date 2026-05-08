import { useModal } from '../context/ModalContext'

export default function ModalHeader({ title }) {
  const { closeModal } = useModal()
  return (
    <div className="modal-hdr">
      <h2>{title}</h2>
      <button className="xbtn" onClick={closeModal}><i className="ti ti-x" /></button>
    </div>
  )
}
