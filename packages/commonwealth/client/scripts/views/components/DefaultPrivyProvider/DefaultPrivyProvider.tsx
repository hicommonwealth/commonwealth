import { useFlag } from 'hooks/useFlag';
import React, { memo } from 'react';
import { LoadPrivy } from './LoadPrivy';
import { WaitForPrivy } from './WaitForPrivy';

type DefaultPrivyProviderProps = {
  children: React.ReactNode;
};

export const DefaultPrivyProvider = memo(function DefaultPrivyProvider(
  props: DefaultPrivyProviderProps,
) {
  const { children } = props;

  const privyEnabled = useFlag('privy');

  if (!privyEnabled) {
    return children;
  }

  return (
    <LoadPrivy>
      <WaitForPrivy>{children}</WaitForPrivy>
    </LoadPrivy>
  );
});
