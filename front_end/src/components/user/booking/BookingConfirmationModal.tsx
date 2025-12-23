import React from 'react';
import { XIcon } from '../icons/index';
import './BookingConfirmationModal.css';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalData: {
    bookingId: string | null;
    action: string;
    notes: string;
  };
  onConfirm: () => void;
  onModalDataChange: (data: { bookingId: string | null; action: string; notes: string }) => void;
}

const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  isOpen,
  onClose,
  modalData,
  onConfirm,
  onModalDataChange
}) => {
  if (!isOpen) return null;

  const getTitle = () => {
    if (modalData.action === 'accept') {
      return 'Chấp nhận booking';
    } else if (modalData.action === 'reject') {
      return 'Từ chối booking';
    } else if (modalData.action === 'complete') {
      return 'Hoàn thành booking';
    }
    return 'Xác nhận booking';
  };

  const getMessage = () => {
    if (modalData.action === 'accept') {
      return 'Bạn có chắc chắn muốn chấp nhận booking này?';
    } else if (modalData.action === 'reject') {
      return 'Bạn có chắc chắn muốn từ chối booking này?';
    } else if (modalData.action === 'complete') {
      return 'Bạn có chắc chắn muốn đánh dấu booking này là đã hoàn thành?';
    }
    return 'Bạn có chắc chắn muốn thực hiện hành động này?';
  };

  return (
    <div className="booking-confirmation-modal-overlay" onClick={onClose}>
      <div className="booking-confirmation-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="booking-confirmation-modal-header">
          <h2>{getTitle()}</h2>
          <button className="booking-confirmation-modal-close" onClick={onClose}>
            <XIcon className="booking-confirmation-modal-close-icon" />
          </button>
        </div>
        
        <div className="booking-confirmation-modal-body">
          <p style={{ marginBottom: '1rem' }}>{getMessage()}</p>
          
          <div className="booking-confirmation-field">
            <label htmlFor="booking-notes-input">
              Ghi chú:
            </label>
            <textarea
              id="booking-notes-input"
              value={modalData.notes}
              onChange={(e) => onModalDataChange({ ...modalData, notes: e.target.value })}
              rows={4}
              placeholder="Nhập ghi chú (tùy chọn)..."
              className="booking-confirmation-textarea"
            />
          </div>
        </div>
        
        <div className="booking-confirmation-form-action">
          <button 
            type="button"
            className="booking-confirmation-btn-primary"
            onClick={onConfirm}
          >
            Xác nhận
          </button>
          <button 
            type="button"
            className="booking-confirmation-btn-secondary"
            onClick={onClose}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationModal;





