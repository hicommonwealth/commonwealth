import 'components/new_proposal_button.scss';

import m from 'mithril';
import _ from 'lodash';
import { Button, ButtonGroup, Icon, Icons, PopoverMenu, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase } from 'models';
import NewThreadModal from 'views/modals/new_thread_modal';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Token from 'controllers/chain/ethereum/token/adapter';

const NewProposalButton: m.Component<{
  fluid: boolean,
  basic?: boolean,
  rounded?: boolean,
  councilCandidates?: Array<[SubstrateAccount, number]>
}> = {
  view: (vnode) => {
    const { fluid, basic, rounded, councilCandidates } = vnode.attrs;

    if (!app.isLoggedIn()) return;
    if (!app.chain && !app.community) return;
    if (!app.activeId()) return;

    return m(Button, {
      class: 'NewProposalButton',
      label: 'New thread',
      rounded,
      basic,
      fluid,
      disabled: !app.user.activeAccount
        || (app.chain && (app.chain as Token).isToken && !(app.chain as Token).hasToken),
      onclick: () => app.modals.create({ modal: NewThreadModal }),
    });
  }
};

export default NewProposalButton;
