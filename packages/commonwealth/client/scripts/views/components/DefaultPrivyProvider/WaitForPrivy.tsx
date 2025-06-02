import { usePrivy } from '@privy-io/react-auth';
import React, { memo } from 'react';
import { LoadingIndicator } from 'views/components/LoadingIndicator/LoadingIndicator';
import './WaitForPrivy.scss';

type WaitForPrivyProps = {
  children: React.ReactNode;
};

export const WaitForPrivy = memo(function WaitForPrivy(
  props: WaitForPrivyProps,
) {
  const { children } = props;

  const { ready } = usePrivy();

  if (!ready) {
    return (
      <div className="WaitForPrivy">
        <LoadingIndicator />;
      </div>
    );
  }

  return children;
});
