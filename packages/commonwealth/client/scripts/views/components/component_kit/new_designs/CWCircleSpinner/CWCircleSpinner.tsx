import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { IconSize } from 'views/components/component_kit/cw_icons/types';
import { ComponentType } from 'views/components/component_kit/types';

import './CWCircleSpinner.scss';

interface CWCircleSpinnerProps {
  size?: IconSize;
}

const CWCircleSpinner = ({ size = 'large' }: CWCircleSpinnerProps) => {
  return (
    <div className={ComponentType.CircleSpinner}>
      <CWIcon iconName="circleNotch" iconSize={size} />
    </div>
  );
};

export default CWCircleSpinner;
