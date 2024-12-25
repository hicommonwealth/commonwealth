import React from 'react';

import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { ComponentType } from './types';

import './cw_validation_text.scss';

export type ValidationStatus = 'success' | 'failure';

export type ValidationTextProps = {
  message?: string;
  status?: ValidationStatus;
  className?: string;
};

export const CWValidationText = (props: ValidationTextProps) => {
  const { message, status, className } = props;

  return (
    <CWText
      type="caption"
      fontWeight="medium"
      className={getClasses(
        { status, className },
        ComponentType.ValidationText,
      )}
    >
      {message}
    </CWText>
  );
};
