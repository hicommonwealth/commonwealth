import clsx from 'clsx';
import React from 'react';
import { ImageBehavior } from '../cw_cover_image_uploader';
import { MessageRow } from '../cw_text_input';
import './CWCoverImageUploader.scss';
import {
  ImageBehaviorSelector,
  ImageBehaviorSelectorProps,
} from './ImageBehaviorSelector';
import { UploadControl, UploadControlProps } from './UploadControl';

type CWCoverImageUploaderProps = UploadControlProps &
  ImageBehaviorSelectorProps & {
    label?: string;
  };

export const CWCoverImageUploader = ({
  // upload control props
  name = `CWCoverImageUploader-${Math.random()}`,
  hookToForm,
  imageURL,
  withAIImageGeneration,
  uploadControlClassName,
  onImageGenerated,
  onImageUploaded,
  onImageProcessingChange,
  // image behavior props
  canSelectImageBehavior = false,
  onImageBehaviorChange,
  imageBehaviorSelectorClassName,
  // common props
  imageBehavior = ImageBehavior.Circle,
  label = 'Accepts JPG and PNG files.',
  disabled,
}: CWCoverImageUploaderProps) => {
  return (
    <div className={clsx('CWCoverImageUploader')}>
      <MessageRow label={label} hasFeedback={true} />
      <UploadControl
        name={name}
        hookToForm={hookToForm}
        imageURL={imageURL}
        withAIImageGeneration={withAIImageGeneration}
        disabled={disabled}
        imageBehavior={imageBehavior}
        uploadControlClassName={uploadControlClassName}
        onImageGenerated={onImageGenerated}
        onImageUploaded={onImageUploaded}
        onImageProcessingChange={onImageProcessingChange}
      />
      <ImageBehaviorSelector
        imageBehavior={imageBehavior}
        canSelectImageBehavior={canSelectImageBehavior}
        onImageBehaviorChange={onImageBehaviorChange}
        imageBehaviorSelectorClassName={imageBehaviorSelectorClassName}
        disabled={disabled}
      />
    </div>
  );
};
