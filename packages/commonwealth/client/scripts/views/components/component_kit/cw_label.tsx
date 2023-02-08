import React from 'react';

import 'components/component_kit/cw_label.scss';
import { CWText } from './cw_text';

import { ComponentType } from './types';

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
