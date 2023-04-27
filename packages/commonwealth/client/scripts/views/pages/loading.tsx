import React from 'react';

import 'pages/loading.scss';

import Sublayout from 'views/sublayout';
import { CWSpinner } from '../components/component_kit/cw_spinner';
import { CWText } from '../components/component_kit/cw_text';

type PageLoadingProps = {
  message?: string;
  hideSearch?: boolean;
};

export const PageLoading = (props: PageLoadingProps) => {
  const { message, hideSearch = true } = props;

  return (
    <Sublayout hideSearch={hideSearch}>
      <div className="LoadingPage">
        <div className="inner-content">
          <CWSpinner size="xl" />
          <CWText>{message}</CWText>
        </div>
      </div>
    </Sublayout>
  );
};
