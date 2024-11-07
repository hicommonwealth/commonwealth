import Thread from 'client/scripts/models/Thread';
import React, { useState } from 'react';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

import { ThreadModal } from './ThreadModal';
import './ThreadPreviewModal.scss';

type ThreadPreviewModalProps = {
  thread: Thread;
  isThreadModalOpen: boolean;
  onClose: () => void;
  images: string[];
};

const ThreadPreviewModal = ({
  isThreadModalOpen,
  onClose,
  images,
  thread,
}: ThreadPreviewModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isThreadModalOpen) return null;

  const handleNext = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevious = () => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length,
    );
  };

  return (
    <div className="thread-preview-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-left">
          <div className="close-btn" onClick={onClose}>
            <CWIcon iconName="close" />
          </div>
          {images.length > 1 && (
            <div className="nav-btn prev-btn">
              <CWIcon iconName="chevronLeft" onClick={handlePrevious} />
            </div>
          )}
          <img
            src={images[currentImageIndex]}
            alt={`Thread content ${currentImageIndex + 1}`}
            className="modal-image"
          />
          {images.length > 1 && (
            <div className="nav-btn next-btn">
              <CWIcon iconName="chevronRight" onClick={handleNext} />
            </div>
          )}
        </div>
        <div className="modal-right">
          <ThreadModal thread={thread} />
        </div>
      </div>
    </div>
  );
};

export default ThreadPreviewModal;
