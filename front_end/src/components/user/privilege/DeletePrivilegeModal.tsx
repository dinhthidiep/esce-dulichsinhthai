import React from 'react';
import { XIcon } from '../icons/index';
import './DeletePrivilegeModal.css';

interface DeletePrivilegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceName: string;
  isDeleting: boolean;
}

const DeletePrivilegeModal: React.FC<DeletePrivilegeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  serviceName,
  isDeleting
}) => {
  if (!isOpen) return null;

  return (
    <div className="delete-privilege-modal-overlay" onClick={onClose}>
      <div className="delete-privilege-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="delete-privilege-modal-header">
          <h2>Xác nhận xóa</h2>
          <button className="delete-privilege-modal-close" onClick={onClose} disabled={isDeleting}>
            <XIcon className="delete-privilege-modal-close-icon" />
          </button>
        </div>
        <div className="delete-privilege-modal-body">
          <div className="delete-privilege-warning-icon">⚠️</div>
          <p className="delete-privilege-message">
            Bạn có chắc chắn muốn xóa ưu đãi <strong>"{serviceName}"</strong>?
          </p>
          <p className="delete-privilege-submessage">
            Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="delete-privilege-modal-footer">
          <button 
            type="button" 
            className="delete-privilege-btn-cancel" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Hủy
          </button>
          <button 
            type="button" 
            className="delete-privilege-btn-delete" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePrivilegeModal;





