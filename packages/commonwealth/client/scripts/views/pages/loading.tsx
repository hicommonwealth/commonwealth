import 'pages/loading.scss';
import React from 'react';
import { CWText } from '../components/component_kit/cw_text';
import CWLoadingSpinner from '../components/component_kit/new_designs/CWLoadingSpinner';

type PageLoadingProps = {
  message?: string;
};

export const PageLoading = (props: PageLoadingProps) => {
  const { message } = props;

  return (
    <div className="LoadingPage">
      <div className="inner-content">
        <CWLoadingSpinner />
        <CWText>{message}</CWText>
      </div>
    </div>
  );
};
