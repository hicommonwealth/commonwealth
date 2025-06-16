import React from 'react';
import { LoadingIndicator } from 'views/components/LoadingIndicator';
import './LoadingIndicatorScreen.scss';

type LoadingIndicatorScreenProps = {
  message?: string;
};

/**
 * A full screen loading indicator.
 */
export const LoadingIndicatorScreen = (props: LoadingIndicatorScreenProps) => {
  return (
    <div className="LoadingIndicatorScreen">
      <LoadingIndicator {...props} />
    </div>
  );
};
