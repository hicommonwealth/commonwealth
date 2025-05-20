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

  // NOTE normally, we would NOT mount the privy components, if the privy
  // feature flag was false, however, Privy won't work with that configuration.
  return (
    <LoadPrivy>
      <WaitForPrivy>{children}</WaitForPrivy>
    </LoadPrivy>
  );
});
