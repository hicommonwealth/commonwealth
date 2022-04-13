/* @jsx m */

import m from 'mithril';
import { Spinner } from 'construct-ui';

import 'pages/loading.scss';

import Sublayout from 'views/sublayout';

type PageLoadingAttrs = {
  message?: string;
  showNewProposalButton?: boolean;
  title?: any;
};

export class PageLoading implements m.ClassComponent<PageLoadingAttrs> {
  view(vnode) {
    const { title, message, showNewProposalButton } = vnode.attrs;

    return (
      <Sublayout
        title={title}
        showNewProposalButton={showNewProposalButton}
        hideSearch={true}
      >
        <div class="LoadingPage">
          <Spinner message={message} active={true} size="xl" />
        </div>
      </Sublayout>
    );
  }
}
