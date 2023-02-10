import React from 'react';

import Sublayout from 'views/sublayout';
import { CWEmptyState } from '../components/component_kit/cw_empty_state';

type ErrorPageProps = { title?: any; message?: string };

const ErrorPage = (props: ErrorPageProps) => {
  const { message } = props;

  return (
    <Sublayout
    // title={title}
    >
      <CWEmptyState
        iconName="cautionTriangle"
        content={message || 'An error occurred while loading this page.'}
      />
    </Sublayout>
  );
};

export default ErrorPage;
