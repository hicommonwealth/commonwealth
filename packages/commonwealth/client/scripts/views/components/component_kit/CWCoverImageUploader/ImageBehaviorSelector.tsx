import clsx from 'clsx';
import React from 'react';
import { CWText } from '../cw_text';
import { CWRadioButton } from '../new_designs/cw_radio_button';
import { ImageBehavior } from './types';

export type ImageBehaviorSelectorProps = {
  canSelectImageBehavior?: boolean;
  onImageBehaviorChange?: (newBehavior: ImageBehavior) => void;
  imageBehavior?: ImageBehavior;
  disabled?: boolean;
  imageBehaviorSelectorClassName?: string;
};

export const ImageBehaviorSelector = ({
  canSelectImageBehavior,
  onImageBehaviorChange,
  imageBehavior,
  disabled,
  imageBehaviorSelectorClassName,
}: ImageBehaviorSelectorProps) => {
  if (!canSelectImageBehavior) return;

  return (
    <div
      className={clsx('ImageBehaviorSelector', imageBehaviorSelectorClassName)}
    >
      <CWText type="caption" fontWeight="medium" className="cover-image-title">
        Choose image behavior
      </CWText>
      {['Fill', 'Circle'].map((option) => (
        <CWRadioButton
          key={option}
          value={ImageBehavior[option]}
          label={option}
          groupName="image-behavior"
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
