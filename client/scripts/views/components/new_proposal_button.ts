import 'components/new_proposal_button.scss';

import m from 'mithril';
import _ from 'lodash';
import { Button, ButtonGroup, Icon, Icons, PopoverMenu, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase } from 'models';
import NewThreadModal from 'views/modals/new_thread_modal';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import Token from 'controllers/chain/ethereum/token/adapter';

const getNewProposalMenu = (candidates: Array<[SubstrateAccount, number]>) => {
  const activeAccount = app.user.activeAccount;
  return [
    m(MenuItem, {
      onclick: () => { m.route.set(`/${app.activeId()}/new/thread`); },
      label: 'New thread',
    }),
    (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate)
      && m(MenuDivider),
    app.chain?.base === ChainBase.CosmosSDK && m(MenuItem, {
      onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
        type: ProposalType.CosmosProposal
      }),
      label: 'New text proposal'
    }),
    app.chain?.base === ChainBase.Substrate && app.chain?.class !== ChainClass.Plasm && [
      m(MenuItem, {
        onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
          type: ProposalType.SubstrateTreasuryProposal
        }),
        label: 'New treasury proposal'
      }),
      m(MenuItem, {
        onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
          type: ProposalType.SubstrateDemocracyProposal
        }),
        label: 'New democracy proposal'
      }),
      m(MenuItem, {
        class: activeAccount && (activeAccount as any).isCouncillor ? '' : 'disabled',
        onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
          type: ProposalType.SubstrateCollectiveProposal
        }),
        label: 'New council motion'
      }),
      m(MenuItem, {
        onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
          type: ProposalType.SubstrateBountyProposal,
        }),
        label: 'New bounty proposal'
      }),
    ],
  ];
};

const getNewProjectMenu = () => {
  return [
    m(MenuItem, {
      onclick: () => { m.route.set(`/${app.activeId()}/new/thread`); },
      label: 'New thread',
    }),
    m(MenuDivider),
    [
      m(MenuItem, {
        onclick: (e) => m.route.set(`/${app.community.id}/new/project`),
        label: 'New Project'
      }),
    ],
  ];
};

export const MobileNewProposalButton: m.Component<{}, { councilCandidates?: Array<[SubstrateAccount, number]> }> = {
  view: (vnode) => {
    return m('.NewProposalButton.MobileNewProposalButton', [
      m(PopoverMenu, {
        class: 'new-proposal-button-popover',
        transitionDuration: 0,
        hoverCloseDelay: 0,
        hasArrow: false,
        trigger: m(Button, {
          disabled: !app.user.activeAccount
            || !app.activeCommunityId() && ((app.chain as Token).isToken && !(app.chain as Token).hasToken),
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

    if (app.community && app.community.id === 'cw-protocol') {      
      return m(ButtonGroup, {
        class: 'NewProposalButton',
      }, [
        m(PopoverMenu, {
          class: 'new-proposal-button-popover',
          transitionDuration: 0,
          hoverCloseDelay: 0,
          hasArrow: false,
          trigger: m(Button, {
            disabled: !app.user.activeAccount
              || ((app.chain as Token).isToken && !(app.chain as Token).hasToken),
            label: 'New thread',
          }),
          position: 'bottom-end',
          closeOnContentClick: true,
          menuAttrs: {
            align: 'left',
          },
          content: getNewProjectMenu(),
        }),
        m(Button, {
          disabled: !app.user.activeAccount
            || ((app.chain as Token).isToken && !(app.chain as Token).hasToken),
          iconLeft: Icons.EDIT,
          fluid,
          onclick: () => app.modals.create({ modal: NewThreadModal }),
        }),
      ]);
    }

    // just a button for communities, or chains without governance
    if (app.community || threadOnly) {
      return m(Button, {
        class: 'NewProposalButton',
        label: 'New thread',
        fluid,
        disabled: !app.user.activeAccount
          || !app.activeCommunityId() && ((app.chain as Token).isToken && !(app.chain as Token).hasToken),
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
          disabled: !app.user.activeAccount
            || ((app.chain as Token).isToken && !(app.chain as Token).hasToken),
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
        disabled: !app.user.activeAccount
          || ((app.chain as Token).isToken && !(app.chain as Token).hasToken),
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
