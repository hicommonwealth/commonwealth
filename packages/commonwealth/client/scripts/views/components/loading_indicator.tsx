import React from 'react';
import 'components/loading_indicator.scss';

export const LoadingIndicator = () => {
  return (
    <div className="LoadingIndicator">
      <div className="outer-circle">
        <div className="inner-circle"></div>
      </div>
    </div>
  );
};
