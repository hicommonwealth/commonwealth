/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_validation_text.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';

export type ValidationStatus = 'success' | 'failure';

export type ValidationTextProps = {
  message?: string;
  status?: ValidationStatus;
};

export const CWValidationText = (props: ValidationTextProps) => {
  const { message, status } = props;

  return (
    <CWText
      type="caption"
      fontWeight="medium"
      className={`${ComponentType.ValidationText} ${status}`}
    >
      {message}
    </CWText>
  );
};
