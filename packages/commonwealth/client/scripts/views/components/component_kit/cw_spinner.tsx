/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_spinner.scss';

import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';
import { IconSize } from './cw_icons/types';

type SpinnerProps = {
  size?: IconSize;
};

export const CWSpinner = (props: SpinnerProps) => {
  const { size = 'xl' } = props;

  return (
    <div className={ComponentType.Spinner}>
      <CWIcon iconName="cow" iconSize={size} />
    </div>
  );
};
