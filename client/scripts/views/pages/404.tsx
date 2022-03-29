/* @jsx m */

/* eslint-disable max-len */

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { EmptyState, Icons } from 'construct-ui';

import 'pages/404.scss';

import Sublayout from 'views/sublayout';

type PageNotFoundAttrs = { title?: string; message?: string };

export class PageNotFound implements m.ClassComponent<PageNotFoundAttrs> {
  oncreate() {
    mixpanel.track('PageVisit', { 'Page Name': '404Page' });
  }

  view(vnode) {
    const { message, title } = vnode.attrs;

    return (
      <Sublayout class="PageNotFound" title={title}>
        <div class="page-not-found-container">
          <EmptyState
            class="PageNotFound"
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
