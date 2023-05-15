import React from 'react';

import Sublayout from 'views/Sublayout';
import { CWEmptyState } from '../components/component_kit/cw_empty_state';

type PageNotFoundProps = { title?: string; message?: string };

export const PageNotFound = (props: PageNotFoundProps) => {
  const { message } = props;

  return (
    <Sublayout
    // title={title}
    >
      <CWEmptyState
        iconName="cautionCircle"
        content={
          message ||
          `
            This page may not be visible to the public.
            If it belongs to a private thread or community, try logging in.
            `
        }
      />
    </Sublayout>
  );
};
