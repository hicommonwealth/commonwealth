import React, { ReactNode } from 'react';
import usePrivyMobileAuthStatusStore from 'views/components/PrivyMobile/usePrivyMobileAuthStatusStore';
import { LoadingIndicator } from 'views/components/react_quill_editor/loading_indicator';

type Props = {
  children: ReactNode;
};

/**
 * Triggers authentication when privy mobile is enabled.
 */
export const PrivyMobileAuthenticator = (props: Props) => {
  const { children } = props;
  const { status: privyMobileAuthStatus } = usePrivyMobileAuthStatusStore();

  if (privyMobileAuthStatus?.enabled) {
    // the *client* doesn't have privy enabled so do not attempt to authenticate.
    return children;
  }

  return <LoadingIndicator />;
};
