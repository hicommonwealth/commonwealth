import React from 'react';
import { CWText } from '../component_kit/cw_text';
import CWCircleMultiplySpinner from '../component_kit/new_designs/CWCircleMultiplySpinner';
import './LoadingIndicator.scss';

type LoadingIndicatorProps = {
  message?: string;
};

export const LoadingIndicator = (props: LoadingIndicatorProps) => {
  const { message } = props;

  return (
    <div className="LoadingIndicator">
      <div className="inner-content">
        <CWCircleMultiplySpinner />
        <CWText>{message}</CWText>
      </div>
    </div>
  );
};
