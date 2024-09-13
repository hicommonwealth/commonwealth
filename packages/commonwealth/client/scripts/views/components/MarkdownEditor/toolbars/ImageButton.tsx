import React from 'react';
import { FileUploadButton } from 'views/components/MarkdownEditor/toolbars/FileUploadButton';

export const IMAGE_ACCEPT =
  '.jpg, .jpeg, .png, .gif, .webp, .svg, .apng, .avif';

type ImageButtonProps = Readonly<{
  onImage?: (file: File) => void;
  text?: string;
}>;

export const ImageButton = (props: ImageButtonProps) => {
  const { onImage } = props;

  return (
    <FileUploadButton accept={IMAGE_ACCEPT} iconName="image" onFile={onImage} />
  );
};
