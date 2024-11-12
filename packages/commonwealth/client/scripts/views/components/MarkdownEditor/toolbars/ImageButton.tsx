import React from 'react';
import { EditorTooltip } from 'views/components/MarkdownEditor/toolbars/EditorTooltip';
import { FileUploadButton } from 'views/components/MarkdownEditor/toolbars/FileUploadButton';

export const IMAGE_ACCEPT =
  '.jpg, .jpeg, .png, .gif, .webp, .svg, .apng, .avif';

type ImageButtonProps = Readonly<{
  onImage: (file: File) => void;
  text?: string;
}>;

export const ImageButton = (props: ImageButtonProps) => {
  const { onImage } = props;

  return (
    <EditorTooltip
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
