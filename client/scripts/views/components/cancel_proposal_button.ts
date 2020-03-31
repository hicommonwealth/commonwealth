import 'components/cancel_proposal_button.scss';

import { default as m } from 'mithril';
import app, { ApiStatus } from 'state';

interface IAttrs {
  label?: string;
}

const CancelProposalButton: m.Component<IAttrs> = {
  view: (vnode: m.VnodeDOM<IAttrs>) => {
    return m('.CancelProposalButton', {
      class: app.chain.networkStatus === ApiStatus.Connected ? '' : 'disabled',
      onclick: (e) => {
        e.preventDefault();
        // TODO: check for login?
      },
    }, vnode.attrs.label || 'Cancel Proposal');
  }
};

export default CancelProposalButton;
