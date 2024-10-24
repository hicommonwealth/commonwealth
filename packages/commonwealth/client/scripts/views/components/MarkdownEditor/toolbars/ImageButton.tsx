import React from 'react';
import { FileUploadButton } from 'views/components/MarkdownEditor/toolbars/FileUploadButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';

export const IMAGE_ACCEPT =
  '.jpg, .jpeg, .png, .gif, .webp, .svg, .apng, .avif';

type ImageButtonProps = Readonly<{
  onImage?: (file: File) => void;
  text?: string;
}>;

export const ImageButton = (props: ImageButtonProps) => {
  const { onImage } = props;

  return (
    <CWTooltip
      content="Upload image"
      renderTrigger={(handleInteraction) => (
        <FileUploadButton
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
          accept={IMAGE_ACCEPT}
          iconName="image"
          onFile={onImage}
        />
      )}
    />
  );
};
