import 'components/component_kit/cw_label.scss';
import React from 'react';
import { CWText } from './cw_text';

import { ComponentType } from './types';

type LabelProps = {
  label: string | React.ReactNode;
};

export const CWLabel = (props: LabelProps) => {
  const { label } = props;

  return (
    <CWText type="caption" className={ComponentType.Label}>
      {label}
    </CWText>
  );
};
