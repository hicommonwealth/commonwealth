/* @jsx m */

import m from 'mithril';
import { Spinner } from 'construct-ui';

import 'pages/loading.scss';

import Sublayout from 'views/sublayout';

type PageLoadingAttrs = {
  message?: string;
};

export class PageLoading implements m.ClassComponent<PageLoadingAttrs> {
  view(vnode) {
    const { message } = vnode.attrs;

    return (
      <Sublayout hideSearch={true}>
        <div class="LoadingPage">
          <Spinner message={message} active={true} size="xl" />
        </div>
      </Sublayout>
    );
  }
}
