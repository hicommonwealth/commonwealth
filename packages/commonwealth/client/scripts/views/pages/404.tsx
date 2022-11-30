/* @jsx m */

import m from 'mithril';

import Sublayout from 'views/sublayout';
import { CWEmptyState } from '../components/component_kit/cw_empty_state';

type PageNotFoundAttrs = { title?: string; message?: string };

export class PageNotFound implements m.ClassComponent<PageNotFoundAttrs> {
  view(vnode: m.Vnode<PageNotFoundAttrs>) {
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
