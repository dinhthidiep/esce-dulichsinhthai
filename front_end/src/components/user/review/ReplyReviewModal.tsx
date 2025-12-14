import React from 'react';
import { XIcon, CalendarIcon, StarIcon } from '../icons/index';
import { getImageUrl } from '~/lib/utils';
import './ReplyReviewModal.css';

interface ReplyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: any;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSubmit: () => void;
  onDelete: () => void;
  isSubmitting: boolean;
}

const ReplyReviewModal: React.FC<ReplyReviewModalProps> = ({
  isOpen,
  onClose,
  review,
  replyText,
  onReplyTextChange,
  onSubmit,
  onDelete,
  isSubmitting
}) => {
  if (!isOpen || !review) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN');
  };

  const user = review.User || review.user || {};
  const userName = user.Name || user.name || 'Người dùng';
  const userAvatar = user.Avatar || user.avatar || '';
  const createdDate = review.CreatedDate || review.createdDate || review.CreatedAt || review.createdAt;

  return (
    <div className="reply-review-modal-overlay" onClick={onClose}>
      <div className="reply-review-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="reply-review-modal-header">
          <h2>Phản hồi đánh giá</h2>
          <button className="reply-review-modal-close" onClick={onClose}>
            <XIcon className="reply-review-modal-close-icon" />
          </button>
        </div>
        
        <div className="reply-review-modal-body">
          {/* Review Information */}
          <div className="reply-review-info-header">
            <div className="reply-review-user-info-inline">
              {userAvatar ? (
                <img 
                  src={getImageUrl(userAvatar, '/img/banahills.jpg')} 
                  alt={userName}
                  className="reply-review-user-avatar"
                  onError={(e) => {
                    e.currentTarget.src = '/img/banahills.jpg';
                  }}
                />
              ) : (
                <div className="reply-review-user-avatar-placeholder">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="reply-review-user-name">{userName}</h3>
              {createdDate && (
                <div className="reply-review-date-info">
                  <CalendarIcon className="reply-review-date-icon-small" />
                  <span>{formatDate(createdDate)}</span>
                </div>
              )}
              <div className="reply-review-rating-badge">
                <StarIcon className="reply-review-star-badge" filled={true} />
                <span className="reply-review-rating-number">
                  {review.Rating || review.rating || 0}
                </span>
              </div>
            </div>
          </div>
          
          <div className="reply-review-comment-section">
            <div className="reply-review-comment-label">Nhận xét:</div>
            <div className="reply-review-comment-content">
              {review.Comment || review.comment || 'Không có nhận xét'}
            </div>
          </div>
          
          {/* Reply Form */}
          <div className="reply-review-field">
            <label htmlFor="reply-text-input">
              Phản hồi của bạn:
            </label>
            <textarea
              id="reply-text-input"
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              rows={6}
              placeholder="Nhập phản hồi của bạn cho đánh giá này..."
              maxLength={1000}
              className="reply-review-textarea"
            />
            <div className="reply-review-hint">
              Còn lại: <span>{1000 - replyText.length}</span> ký tự
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="reply-review-form-action">
            <button 
              type="button"
              className="reply-review-btn-primary"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </button>
            {review.Replies && review.Replies.length > 0 && (
              <button 
                type="button"
                className="reply-review-btn-secondary"
                onClick={onDelete}
                disabled={isSubmitting}
              >
                Xóa phản hồi
              </button>
            )}
            <button 
              type="button"
              className="reply-review-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyReviewModal;





