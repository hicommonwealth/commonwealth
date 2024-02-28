import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { IconSize } from 'views/components/component_kit/cw_icons/types';
import { ComponentType } from 'views/components/component_kit/types';

import './CWCircleRingSpinner.scss';

interface CWCircleRingSpinnerProps {
  size?: IconSize;
}

const CWCircleRingSpinner = ({ size = 'large' }: CWCircleRingSpinnerProps) => {
  return (
    <div className={ComponentType.CircleRingSpinner}>
      <CWIcon iconName="circleNotch" iconSize={size} />
    </div>
  );
};

export default CWCircleRingSpinner;
