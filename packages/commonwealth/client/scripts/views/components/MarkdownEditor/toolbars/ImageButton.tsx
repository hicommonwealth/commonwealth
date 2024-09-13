import React from 'react';
import { FileUploadButton } from 'views/components/MarkdownEditor/toolbars/FileUploadButton';

type ImageButtonProps = Readonly<{
  onImage?: (file: File) => void;
  text?: string;
}>;

export const ImageButton = (props: ImageButtonProps) => {
  const { onImage } = props;

  return (
    <FileUploadButton
      accept=".jpg, .jpeg, .png, .gif, .webp, .svg, .apng, .avif"
      iconName="image"
      onFile={onImage}
    />
  );
};
