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

  return (
    <LoadPrivy>
      <WaitForPrivy>{children}</WaitForPrivy>
    </LoadPrivy>
  );
});
