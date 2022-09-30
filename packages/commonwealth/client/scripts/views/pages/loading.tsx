/* @jsx m */

import m from 'mithril';
import { Spinner } from 'construct-ui';

import 'pages/loading.scss';

import Sublayout from 'views/sublayout';

type PageLoadingAttrs = {
  message?: string;
  showCreateContentMenuTrigger?: boolean;
  title?: any;
};

export class PageLoading implements m.ClassComponent<PageLoadingAttrs> {
  view(vnode) {
    const { title, message, showCreateContentMenuTrigger } = vnode.attrs;

    return (
      <Sublayout
        title={title}
        showCreateContentMenuTrigger={showCreateContentMenuTrigger}
        hideSearch={true}
      >
        <div class="LoadingPage">
          <Spinner message={message} active={true} size="xl" />
        </div>
      </Sublayout>
    );
  }
}
