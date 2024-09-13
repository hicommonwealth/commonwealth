import React, { useCallback, useRef } from 'react';

import { DEFAULT_ICON_SIZE } from 'views/components/MarkdownEditor/utils/iconComponentFor';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import type { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

import './FileUploadButton.scss';

type FileUploadButtonProps = Readonly<{
  accept: string;
  iconName: IconName;
  onFile?: (file: File) => void;
  text?: string;
}>;

export const FileUploadButton = (props: FileUploadButtonProps) => {
  const { onFile, accept, iconName, text } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = useCallback(() => {
    if (fileInputRef.current) {
      // this is needed to clear the current file input ref or else you won't
      // be able to import the same file multiple times.
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const fileHandler = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        onFile?.(event.target.files[0]);
      }
    },
    [onFile],
  );

  return (
    <div className="FileUploadButton">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="FilePickerInput"
        onChange={fileHandler}
      />
      <button onClick={handleClick} className="FilePickerButton">
        <div className="IconAndText">
          <CWIcon iconName={iconName} iconSize={DEFAULT_ICON_SIZE} />

          {text && <div>{text}</div>}
        </div>
      </button>
    </div>
  );
};
