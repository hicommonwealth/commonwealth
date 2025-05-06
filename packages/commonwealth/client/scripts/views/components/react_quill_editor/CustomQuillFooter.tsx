import React, { useRef } from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { ThreadActionPopover } from '../NewThreadFormLegacy/ThreadActionPopover/ThreadActionPopover';

type CustomQuillFooterProps = {
  handleImageUploader: (file: File) => Promise<string>;
  setSelectedActionCard?: React.Dispatch<React.SetStateAction<string[]>>;
  selectedActionCard?: string[];
};

export const CustomQuillFooter = ({
  handleImageUploader,
  setSelectedActionCard,
  selectedActionCard,
}: CustomQuillFooterProps) => {
  const imgFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImgUploadClick = () => {
    // @ts-expect-error <StrictNullChecks/>
    imgFileInputRef.current.click();
  };

  const handleImgUpload = () => {
    // @ts-expect-error <StrictNullChecks/>
    handleImageUploader(imgFileInputRef.current.files[0]);
  };

  return (
    <div id="custom-footer" className="CustomQuillFooter">
      <input
        type="file"
        id="img-file-input"
        ref={imgFileInputRef}
        onChange={handleImgUpload}
        accept="image/png, image/gif, image/jpeg"
      />
      <div id="img-upload-trigger" onClick={handleImgUploadClick}>
        <span className="icon-container">
          <CWIcon iconName="imageSquare" iconSize="small" />
        </span>
        <CWText type="caption">Drag an image or click to add</CWText>
      </div>

      <ThreadActionPopover
        setSelectedActionCard={setSelectedActionCard}
        selectedActionCard={selectedActionCard}
      />
    </div>
  );
};
