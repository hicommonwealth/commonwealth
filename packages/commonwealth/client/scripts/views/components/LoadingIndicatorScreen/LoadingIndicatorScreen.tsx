import React from 'react';
import { LoadingIndicator } from 'views/components/LoadingIndicator';
import './LoadingIndicatorScreen.scss';

/**
 * A full screen loading indicator.
 */
export const LoadingIndicatorScreen = () => {
  return (
    <div className="LoadingIndicatorScreen">
      <LoadingIndicator />
    </div>
  );
};
