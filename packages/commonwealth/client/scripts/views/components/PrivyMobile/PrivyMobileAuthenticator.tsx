import { ReactNode } from 'react';
import usePrivyMobileAuthStatusStore from 'views/components/PrivyMobile/usePrivyMobileAuthStatusStore';

type Props = {
  children: ReactNode;
};

/**
 * Triggers authentication when privy mobile is enabled.
 */
export const PrivyMobileAuthenticator = (props: Props) => {
  const { children } = props;
  const { status: privyMobileAuthStatus } = usePrivyMobileAuthStatusStore();

  console.log(
    'PrivyMobileAuthenticator: Working with privyMobileAuthStatus:' +
      JSON.stringify(privyMobileAuthStatus, null, 2),
  );

  if (privyMobileAuthStatus?.enabled) {
    // the *client* doesn't have privy enabled so do not attempt to authenticate.
    return children;
  }

  //return <LoadingIndicator />;
  return children;
};
