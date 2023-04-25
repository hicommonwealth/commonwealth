import React from 'react';

import Sublayout from 'views/sublayout';
import { CWEmptyState } from '../components/component_kit/cw_empty_state';
import { openConfirmation } from 'views/modals/confirmation_modal';

type ErrorPageProps = { title?: any; message?: string };

const ErrorPage = ({ message }: ErrorPageProps) => {
  const chunkLoadingErrRe = /^Uncaught SyntaxError: Unexpected token/;

  const isChunkLoadingError = () => {
    if (typeof message === 'string' && chunkLoadingErrRe.test(message)) {
      openConfirmation({
        title: 'Info',
        description: (
          <>
            A new version of the application has been released. Please refresh
            the page.
          </>
        ),
        buttons: [
          {
            label: 'Refresh',
            buttonType: 'mini-black',
            onClick: () => window.location.reload(),
          },
        ],
      });
    }

    return null;
  };

  return (
    <Sublayout>
      <>
        {isChunkLoadingError()}
        <CWEmptyState
          iconName="cautionTriangle"
          content={message || 'An error occurred while loading this page.'}
        />
      </>
    </Sublayout>
  );
};

export default ErrorPage;
