import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import { Tooltip, Button, Icon, Icons, PopoverMenu, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';
import { ProposalType } from 'identifiers';
import { ChainClass } from 'models';
import { CosmosAccount } from 'controllers/chain/cosmos/account';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import NewProposalModal from 'views/modals/proposals';

const NewProposalButton: m.Component<{ fluid: boolean }> = {
  view: (vnode) => {
    const activeAccount = app.vm.activeAccount;
    const fluid = !!vnode.attrs.fluid;

    if (!app.isLoggedIn()) return;

    // just a button for communities, or chains without governance
    if (app.community) {
      return m(Button, {
        class: 'NewProposalButton',
        label: 'New post',
        iconLeft: Icons.PLUS,
        size: 'sm',
        intent: 'primary',
        fluid,
        disabled: !activeAccount,
        onclick: () => { m.route.set(`/${app.activeId()}/new/thread`); },
      });
    }

    // a button with popover menu for chains
    return m(PopoverMenu, {
      class: 'NewProposalButton',
      transitionDuration: 0,
      trigger: activeAccount ? m(Button, {
        iconLeft: Icons.CHEVRON_DOWN,
        label: 'New post',
        size: 'sm',
        intent: 'primary',
        fluid,
      }) : m(Tooltip, {
        content: 'Link an address to post',
        trigger: m(Button, {
          iconLeft: Icons.CHEVRON_DOWN,
          size: 'xs',
          intent: 'primary',
          class: 'cui-disabled',
          style: 'cursor: pointer !important',
          fluid,
        }),
      }),
      position: 'bottom-end',
      closeOnContentClick: true,
      menuAttrs: {
        align: 'left',
      },
      content: [
        app.activeId() && m(MenuItem, {
          onclick: () => { m.route.set(`/${app.activeId()}/new/thread`); },
          label: 'New thread',
        }),

        m(MenuDivider),
        activeAccount instanceof CosmosAccount && m(MenuItem, {
          onclick: (e) => app.modals.create({
            modal: NewProposalModal,
            data: { typeEnum: ProposalType.CosmosProposal }
          }),
          label: 'New proposal'
        }),
        activeAccount instanceof SubstrateAccount && activeAccount.chainClass === ChainClass.Edgeware && m(MenuItem, {
          onclick: () => { m.route.set(`/${activeAccount.chain.id}/new/signaling`); },
          label: 'New signaling proposal'
        }),

        activeAccount instanceof SubstrateAccount && m(MenuItem, {
          onclick: (e) => app.modals.create({
            modal: NewProposalModal,
            data: { typeEnum: ProposalType.SubstrateTreasuryProposal }
          }),
          label: 'New treasury proposal'
        }),
        activeAccount instanceof SubstrateAccount && m(MenuItem, {
          onclick: (e) => app.modals.create({
            modal: NewProposalModal,
            data: { typeEnum: ProposalType.SubstrateDemocracyProposal }
          }),
          label: 'New democracy proposal'
        }),
        activeAccount instanceof SubstrateAccount && m(MenuItem, {
          class: activeAccount.isCouncillor ? '' : 'disabled',
          onclick: (e) => app.modals.create({
            modal: NewProposalModal,
            data: { typeEnum: ProposalType.SubstrateCollectiveProposal }
          }),
          label: 'New council motion'
        }),
      ],
    });
  }
};

export default NewProposalButton;
