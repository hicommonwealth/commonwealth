import React from 'react';
import { CWIconButton } from '../component_kit/cw_icon_button';
import './ReferenceImageItem.scss';

interface ReferenceImageItemProps {
  imageUrl?: string;
  onRemove?: () => void;
  onUploadClick?: () => void;
  uploadInputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * A simplified component for reference image thumbnails that supports both
 * displaying existing images (with remove option) and an empty upload state.
 */
export const ReferenceImageItem: React.FC<ReferenceImageItemProps> = ({
  imageUrl,
  onRemove,
  onUploadClick,
  uploadInputRef,
}) => {
  const hasImage = !!imageUrl;

  return (
    <div
      className="ReferenceImageItem"
      onClick={!hasImage ? onUploadClick : undefined}
    >
      {/* Icon button for adding or removing */}
      <div
        className={`icon-button-container ${hasImage ? 'with-image' : 'empty'}`}
      >
        {hasImage && onRemove ? (
          <CWIconButton
            iconButtonTheme="primary"
            iconName="close"
            iconSize="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove reference image"
          />
        ) : (
          <CWIconButton
            iconButtonTheme="primary"
            iconName="plusCircle"
            iconSize="small"
          />
        )}
      </div>

      {/* Content container */}
      <div className="content-container">
        {hasImage ? (
          <img src={imageUrl} alt="Reference" />
        ) : (
          <div className="empty-state" />
        )}
      </div>
    </div>
  );
};
