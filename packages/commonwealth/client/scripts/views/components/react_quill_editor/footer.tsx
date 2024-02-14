import React, { useRef } from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';

export const CustomQuillFooter = () => {
  const imgFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImgUploadClick = () => {
    imgFileInputRef.current.click();
  };

  return (
    <div id="custom-footer" className="CustomQuillFooter">
      <input type="file" id="img-file-input" ref={imgFileInputRef} />
      <div id="img-upload-trigger" onClick={handleImgUploadClick}>
        <span className="icon-container">
          <CWIcon iconName="imageSquare" iconSize="small" />
        </span>
        <CWText type="caption">Drag an image or click to add</CWText>
      </div>
      <div className="editor-handle">
        <CWIcon iconName="notches" iconSize="small" />
      </div>
    </div>
  );
};
