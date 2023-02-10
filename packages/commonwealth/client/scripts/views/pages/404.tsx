import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import Sublayout from 'views/sublayout';
import { CWEmptyState } from '../components/component_kit/cw_empty_state';

type PageNotFoundAttrs = { title?: string; message?: string };

export default class PageNotFound extends ClassComponent<PageNotFoundAttrs> {
  view(vnode: ResultNode<PageNotFoundAttrs>) {
    const { message } = vnode.attrs;

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
  }
}
