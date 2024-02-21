import clsx from 'clsx';
import React from 'react';

import { ComponentType } from 'views/components/component_kit/types';

import './CWLoadingSpinner.scss';

interface CWLoadingSpinnerProps {
  center?: boolean;
}

const CWLoadingSpinner = ({ center }: CWLoadingSpinnerProps) => {
  return (
    <div className={clsx(ComponentType.LoadingSpinner, { center })}>
      <div className="container">
        <div className="pink-1"></div>
        <div className="blue"></div>
        <div className="pink-2"></div>
      </div>
    </div>
  );
};

export default CWLoadingSpinner;
