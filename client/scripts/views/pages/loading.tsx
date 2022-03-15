/* @jsx m */

import m from 'mithril';
import { Spinner } from 'construct-ui';

import Sublayout from 'views/sublayout';

type PageLoadingAttrs = {
  message?: string;
  showNewProposalButton?: boolean;
  title?;
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
        <Spinner
          fill={true}
          message={message}
          size="xl"
          style="visibility: visible; opacity: 1;"
        />
      </Sublayout>
    );
  }
}
