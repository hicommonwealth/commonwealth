import clsx from 'clsx';
import React from 'react';
import { MessageRow } from '../cw_text_input';
import './CWCoverImageUploader.scss';
import {
  ImageBehaviorSelector,
  ImageBehaviorSelectorProps,
} from './ImageBehaviorSelector';
import { UploadControl } from './UploadControl';
import { ImageBehavior, UploadControlProps } from './types';

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
  onProcessedImagesListChange,
  canSwitchBetweenProcessedImages,
  processedImages,
  // image behavior props
  canSelectImageBehavior = false,
  onImageBehaviorChange,
  imageBehaviorSelectorClassName,
  allowedImageBehaviours,
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
        canSwitchBetweenProcessedImages={canSwitchBetweenProcessedImages}
        onImageGenerated={onImageGenerated}
        onImageUploaded={onImageUploaded}
        onImageProcessingChange={onImageProcessingChange}
        onProcessedImagesListChange={onProcessedImagesListChange}
        processedImages={processedImages}
      />
      <ImageBehaviorSelector
        imageBehavior={imageBehavior}
        canSelectImageBehavior={canSelectImageBehavior}
        onImageBehaviorChange={onImageBehaviorChange}
        imageBehaviorSelectorClassName={imageBehaviorSelectorClassName}
        disabled={disabled}
        allowedImageBehaviours={allowedImageBehaviours}
      />
    </div>
  );
};
