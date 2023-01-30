/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_label.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';

type LabelProps = {
  label: string;
};

export const CWLabel = (props: LabelProps) => {
  const { label } = props;

  return (
    <CWText type="caption" className={ComponentType.Label}>
      {label}
    </CWText>
  );
};
