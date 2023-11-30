import React from 'react';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { CWEmptyState } from '../components/component_kit/cw_empty_state';

type ErrorPageProps = { title?: any; message?: string | JSX.Element };

const ErrorPage = ({ message }: ErrorPageProps) => {
  const chunkLoadingErrRe = /Loading chunk/;

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
            buttonType: 'primary',
            buttonHeight: 'sm',
            onClick: () => window.location.reload(),
          },
        ],
      });
    }

    return null;
  };

  return (
    <>
      {isChunkLoadingError()}
      <CWEmptyState
        iconName="cautionTriangle"
        content={message || 'An error occurred while loading this page.'}
      />
    </>
  );
};

export default ErrorPage;
