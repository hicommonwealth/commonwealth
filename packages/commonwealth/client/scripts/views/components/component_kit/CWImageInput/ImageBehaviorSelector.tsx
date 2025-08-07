import clsx from 'clsx';
import React, { useState } from 'react';
import { CWRadioButton } from '../cw_radio_button';
import { CWText } from '../cw_text';
import { ImageBehavior } from './types';

export type ImageBehaviorSelectorProps = {
  canSelectImageBehavior?: boolean;
  onImageBehaviorChange?: (newBehavior: ImageBehavior) => void;
  imageBehavior?: ImageBehavior;
  disabled?: boolean;
  imageBehaviorSelectorClassName?: string;
  allowedImageBehaviours?: (keyof typeof ImageBehavior)[];
};

export const ImageBehaviorSelector = ({
  canSelectImageBehavior,
  onImageBehaviorChange,
  imageBehavior,
  disabled,
  imageBehaviorSelectorClassName,
  allowedImageBehaviours = ['Fill', 'Circle'],
}: ImageBehaviorSelectorProps) => {
  const [groupName] = useState(`image-behavior-${Math.random()}`);
  if (!canSelectImageBehavior) return;

  return (
    <div
      className={clsx('ImageBehaviorSelector', imageBehaviorSelectorClassName)}
    >
      <CWText type="caption" fontWeight="medium" className="cover-image-title">
        Choose image behavior
      </CWText>
      {allowedImageBehaviours.map((option) => (
        <CWRadioButton
          key={option}
          value={ImageBehavior[option]}
          label={option}
          groupName={groupName}
          checked={imageBehavior === ImageBehavior[option]}
          onChange={(e) => {
            if (e.target.checked && !disabled) {
              onImageBehaviorChange?.(ImageBehavior[option]);
            }
          }}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
