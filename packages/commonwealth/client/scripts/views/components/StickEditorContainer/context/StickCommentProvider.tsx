import React, { memo, ReactNode, useState } from 'react';
import { ActivatorContext } from './ActivatorContext';

type Props = {
  children: ReactNode;
};

/**
 * The provider which has to wrap our entire comment reply system.
 */
export const StickCommentProvider = memo(function StickCommentProvider(
  props: Props,
) {
  const [defaultElement, setDefaultElement] = useState<ReactNode | null>(null);
  const [activeElement, setActiveElement] = useState<ReactNode | null>(null);

  return (
    <ActivatorContext.Provider
      value={{
        defaultElement,
        setDefaultElement,
        activeElement,
        setActiveElement,
      }}
    >
      {props.children}
    </ActivatorContext.Provider>
  );
});
