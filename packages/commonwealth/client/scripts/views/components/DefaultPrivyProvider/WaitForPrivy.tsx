import { usePrivy } from '@privy-io/react-auth';
import React, { memo } from 'react';
import { PageLoading } from 'views/pages/loading';
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
        <PageLoading />;
      </div>
    );
  }

  return children;
});
