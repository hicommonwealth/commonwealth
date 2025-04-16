import { usePrivy } from '@privy-io/react-auth';
import React, { memo } from 'react';

type WaitForPrivyProps = {
  children: React.ReactNode;
};

export const WaitForPrivy = memo(function WaitForPrivy(
  props: WaitForPrivyProps,
) {
  const { children } = props;

  const { ready } = usePrivy();

  if (!ready) {
    // TODO: using a loading progress indicator?
    return <div>Waiting for privy</div>;
  }

  return children;
});
