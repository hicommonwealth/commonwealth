import React, { useRef } from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';

type CustomQuillFooterProps = {
  handleImageUploader: (file: File) => Promise<string>;
};

export const CustomQuillFooter = ({
  handleImageUploader,
}: CustomQuillFooterProps) => {
  const imgFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImgUploadClick = () => {
    imgFileInputRef.current.click();
  };

  const handleImgUpload = () => {
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
    </div>
  );
};
