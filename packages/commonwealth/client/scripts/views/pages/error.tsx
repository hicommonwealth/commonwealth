import React from 'react';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { CWEmptyState } from '../components/component_kit/cw_empty_state';

export type AutomationTestProps = {
  testid?: string;
};

type ErrorPageProps = {
  message?: string | JSX.Element;
} & AutomationTestProps;

const ErrorPage = ({ message, testid }: ErrorPageProps) => {
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
        testid={testid}
      />
    </>
  );
};

export default ErrorPage;
