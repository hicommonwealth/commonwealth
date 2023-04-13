import 'components/component_kit/cw_spinner.scss';
import React from 'react';
import { CWIcon } from './cw_icons/cw_icon';
import type { IconSize } from './cw_icons/types';

import { ComponentType } from './types';

type SpinnerProps = {
  size?: IconSize;
};

export const FormattedCWSpinner = (props: SpinnerProps) => {
  return (
    <div className="LoadingPage">
      <div className="inner-content">
        <CWSpinner size={props.size}/>
      </div>
    </div>
  );
};

export const CWSpinner = (props: SpinnerProps) => {
  const { size = 'xl' } = props;

  return (
    <div className={ComponentType.Spinner}>
      <CWIcon iconName="cow" iconSize={size}/>
    </div>
  );
};
