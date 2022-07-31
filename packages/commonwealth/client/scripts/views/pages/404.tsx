/* @jsx m */

/* eslint-disable max-len */

import m from 'mithril';
import { EmptyState, Icons } from 'construct-ui';

import 'pages/404.scss';

import Sublayout from 'views/sublayout';

type PageNotFoundAttrs = { title?: string; message?: string };

export class PageNotFound implements m.ClassComponent<PageNotFoundAttrs> {
  oncreate() {}

  view(vnode) {
    const { message, title } = vnode.attrs;

    return (
      <Sublayout title={title}>
        <div class="PageNotFound">
          <EmptyState
            icon={Icons.HELP_CIRCLE}
            header="Page not found"
            content={
              message ||
              'This page may not be visible to the public. If it belongs to a private thread or community, try logging in.'
            }
          />
        </div>
      </Sublayout>
    );
  }
}
