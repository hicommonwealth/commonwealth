import 'components/new_proposal_button.scss';

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import { Button, ButtonGroup, Icon, Icons, PopoverMenu, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';
import { ProposalType } from 'identifiers';
import { ChainClass } from 'models';
import { CosmosAccount } from 'controllers/chain/cosmos/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import NewThreadModal from 'views/modals/new_thread_modal';

const NewProposalButton: m.Component<{ fluid: boolean }> = {
  view: (vnode) => {
    const activeAccount = app.user.activeAccount;
    const fluid = !!vnode.attrs.fluid;

    if (!app.isLoggedIn()) return;
    if (!app.chain && !app.community) return;
    if (!app.activeId()) return;

    // just a button for communities, or chains without governance
    if (app.community) {
      return m(Button, {
        class: 'NewProposalButton',
        label: 'New post',
        intent: 'primary',
        fluid,
        disabled: !activeAccount,
        size: 'sm',
        onclick: () => app.modals.create({ modal: NewThreadModal }),
      });
    }

    const ProposalButtonGroup = m(ButtonGroup, [
      m(Button, {
        disabled: !activeAccount,
        intent: 'primary',
        label: 'New post',
        fluid,
        size: 'sm',
        onclick: () => app.modals.create({ modal: NewThreadModal }),
      }),
      m(PopoverMenu, {
        class: 'NewProposalButton',
        transitionDuration: 0,
        hoverCloseDelay: 0,
        trigger: m(Button, {
          disabled: !activeAccount,
          iconLeft: Icons.CHEVRON_DOWN,
          intent: 'primary',
          size: 'sm',
        }),
        position: 'bottom-end',
        closeOnContentClick: true,
        menuAttrs: {
          align: 'left',
        },
        content: [
          m(MenuItem, {
            onclick: () => { m.route.set(`/${app.activeId()}/new/thread`); },
            label: 'New post',
          }),
          (activeAccount instanceof CosmosAccount || activeAccount instanceof SubstrateAccount)
            && m(MenuDivider),
          activeAccount instanceof CosmosAccount && m(MenuItem, {
            onclick: (e) => m.route.set(`/${activeAccount.chain.id}/new/proposal/:type`, { type: ProposalType.CosmosProposal }),
            label: 'New proposal'
          }),
          activeAccount instanceof SubstrateAccount && activeAccount.chainClass === ChainClass.Edgeware && m(MenuItem, {
            onclick: () => { m.route.set(`/${activeAccount.chain.id}/new/signaling`); },
            label: 'New signaling proposal'
          }),
          activeAccount instanceof SubstrateAccount && m(MenuItem, {
            onclick: (e) => m.route.set(`/${activeAccount.chain.id}/new/proposal/:type`, { type: ProposalType.SubstrateTreasuryProposal }),
            label: 'New treasury proposal'
          }),
          activeAccount instanceof SubstrateAccount && m(MenuItem, {
            onclick: (e) => m.route.set(`/${activeAccount.chain.id}/new/proposal/:type`, { type: ProposalType.SubstrateDemocracyProposal }),
            label: 'New democracy proposal'
          }),
          activeAccount instanceof SubstrateAccount && m(MenuItem, {
            class: activeAccount.isCouncillor ? '' : 'disabled',
            onclick: (e) => m.route.set(`/${activeAccount.chain.id}/new/proposal/:type`, { type: ProposalType.SubstrateCollectiveProposal }),
            label: 'New council motion'
          }),
        ],
      }),
    ]);

    // a button with popover menu for chains
    return ProposalButtonGroup;
  }
};

export default NewProposalButton;
