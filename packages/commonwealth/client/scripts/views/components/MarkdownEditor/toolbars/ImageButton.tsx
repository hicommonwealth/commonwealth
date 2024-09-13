import React, { useCallback, useRef } from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { DEFAULT_ICON_SIZE } from 'views/components/MarkdownEditor/utils/iconComponentFor';
import './ImageButton.scss';

type ImageButtonProps = Readonly<{
  onImage?: (file: File) => void;
}>;

export const ImageButton = (props: ImageButtonProps) => {
  const { onImage } = props;

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
        onImage?.(event.target.files[0]);
      }
    },
    [onImage],
  );

  return (
    <div className="ImageButton">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg, .jpeg, .png, .gif, .webp, .svg, .apng, .avif"
        className="FilePickerInput"
        onChange={fileHandler}
      />
      <button onClick={handleClick} className="FilePickerButton">
        <CWIcon iconName="image" iconSize={DEFAULT_ICON_SIZE} />
      </button>
    </div>
  );
};
