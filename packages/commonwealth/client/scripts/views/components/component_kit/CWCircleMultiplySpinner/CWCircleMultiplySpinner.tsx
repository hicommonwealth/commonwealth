import clsx from 'clsx';
import React from 'react';
import { ComponentType } from 'views/components/component_kit/types';

import './CWCircleMultiplySpinner.scss';

interface CWCircleMultiplySpinnerProps {
  center?: boolean;
}

const CWCircleMultiplySpinner = ({
  center = true,
}: CWCircleMultiplySpinnerProps) => {
  return (
    <div className={clsx(ComponentType.CircleMultiplySpinner, { center })}>
      <div className="container">
        <div className="pink-1"></div>
        <div className="blue"></div>
        <div className="pink-2"></div>
      </div>
    </div>
  );
};

export default CWCircleMultiplySpinner;
