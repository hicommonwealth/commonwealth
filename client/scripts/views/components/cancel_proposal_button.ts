import 'components/cancel_proposal_button.scss';

import m from 'mithril';
import { Button } from 'construct-ui';

import app, { ApiStatus } from 'state';

interface IAttrs {
  label?: string;
}

const CancelProposalButton: m.Component<IAttrs> = {
  view: (vnode: m.VnodeDOM<IAttrs>) => {
    return m(Button, {
      class: 'CancelProposalButton',
      disabled: app.chain.networkStatus !== ApiStatus.Connected,
      onclick: (e) => {
        e.preventDefault();
        // TODO: check for login?
      },
      label: vnode.attrs.label || 'Cancel Proposal'
    });
  }
};

export default CancelProposalButton;
