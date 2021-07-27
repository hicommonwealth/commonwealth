import 'components/new_proposal_button.scss';

import m from 'mithril';
import _ from 'lodash';
import { Button, ButtonGroup, Icon, Icons, PopoverMenu, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';
import { ProposalType } from 'identifiers';
import { ChainBase, ChainNetwork } from 'models';
import NewThreadModal from 'views/modals/new_thread_modal';
import { SubstrateAccount } from 'controllers/chain/substrate/account';

export const getNewProposalMenu = (candidates?: Array<[SubstrateAccount, number]>, mobile?: boolean) => {
  const activeAccount = app.user.activeAccount;
  return [
    m(MenuItem, {
      onclick: () => { m.route.set(`/${app.activeId()}/new/thread`); },
      label: 'New thread',
      iconLeft: mobile ? Icons.PLUS : undefined,
    }),
    (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate)
      && !mobile
      && m(MenuDivider),
    app.chain?.base === ChainBase.CosmosSDK && m(MenuItem, {
      onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
        type: ProposalType.CosmosProposal
      }),
      label: 'New text proposal',
      iconLeft: mobile ? Icons.PLUS : undefined,
    }),
    app.chain?.base === ChainBase.Substrate && app.chain?.network !== ChainNetwork.Plasm && [
      m(MenuItem, {
        onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
          type: ProposalType.SubstrateTreasuryProposal
        }),
        label: 'New treasury proposal',
        iconLeft: mobile ? Icons.PLUS : undefined,
      }),
      m(MenuItem, {
        onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
          type: ProposalType.SubstrateDemocracyProposal
        }),
        label: 'New democracy proposal',
        iconLeft: mobile ? Icons.PLUS : undefined,
      }),
      m(MenuItem, {
        class: activeAccount && (activeAccount as any).isCouncillor ? '' : 'disabled',
        onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
          type: ProposalType.SubstrateCollectiveProposal
        }),
        label: 'New council motion',
        iconLeft: mobile ? Icons.PLUS : undefined,
      }),
      m(MenuItem, {
        onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
          type: ProposalType.SubstrateBountyProposal,
        }),
        label: 'New bounty proposal',
        iconLeft: mobile ? Icons.PLUS : undefined,
      }),
      m(MenuItem, {
        onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
          type: ProposalType.SubstrateTreasuryTip,
        }),
        label: 'New tip',
        iconLeft: mobile ? Icons.PLUS : undefined,
      }),
    ],
  ];
};

export const MobileNewProposalButton: m.Component<{}, { councilCandidates?: Array<[SubstrateAccount, number]> }> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return;
    if (!app.chain && !app.community) return;
    if (!app.activeId()) return;
    return m('.NewProposalButton.MobileNewProposalButton', [
      m(PopoverMenu, {
        class: 'new-proposal-button-popover',
        transitionDuration: 0,
        hoverCloseDelay: 0,
        hasArrow: false,
        trigger: m(Button, {
          disabled: !app.user.activeAccount,
          label: m(Icon, { name: Icons.PLUS }),
        }),
        inline: true,
        position: 'bottom-start',
        closeOnContentClick: true,
        menuAttrs: {
          align: 'left',
        },
        content: getNewProposalMenu(vnode.state.councilCandidates),
      }),
    ]);
  }
};

const NewProposalButton: m.Component<{
  fluid: boolean,
  threadOnly?: boolean,
  councilCandidates?: Array<[SubstrateAccount, number]>
}> = {
  view: (vnode) => {
    const { fluid, threadOnly, councilCandidates } = vnode.attrs;

    if (!app.isLoggedIn()) return;
    if (!app.chain && !app.community) return;
    if (!app.activeId()) return;

    // just a button for communities, or chains without governance
    if (app.community || threadOnly) {
      return m(Button, {
        class: 'NewProposalButton',
        label: 'New thread',
        fluid,
        disabled: !app.user.activeAccount,
        onclick: () => app.modals.create({ modal: NewThreadModal }),
      });
    }

    const ProposalButtonGroup = m(ButtonGroup, {
      class: 'NewProposalButton',
    }, [
      m(PopoverMenu, {
        class: 'new-proposal-button-popover',
        transitionDuration: 0,
        hoverCloseDelay: 0,
        hasArrow: false,
        trigger: m(Button, {
          disabled: !app.user.activeAccount,
          label: 'New thread',
        }),
        position: 'bottom-end',
        closeOnContentClick: true,
        menuAttrs: {
          align: 'left',
        },
        content: getNewProposalMenu(councilCandidates),
      }),
      m(Button, {
        disabled: !app.user.activeAccount,
        iconLeft: Icons.EDIT,
        fluid,
        onclick: () => app.modals.create({ modal: NewThreadModal }),
      }),
    ]);

    // a button with popover menu for chains
    return ProposalButtonGroup;
  }
};

export default NewProposalButton;
