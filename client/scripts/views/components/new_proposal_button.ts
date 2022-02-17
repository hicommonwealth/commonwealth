import 'components/new_proposal_button.scss';

import m from 'mithril';
import _ from 'lodash';
import { Button, ButtonGroup, Icon, Icons, PopoverMenu, MenuItem, MenuDivider } from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';
import { ProposalType, ChainBase, ChainNetwork } from 'types';
import NewThreadModal from 'views/modals/new_thread_modal';
import { SubstrateAccount } from 'controllers/chain/substrate/account';

export const getNewProposalMenu = (candidates?: Array<[SubstrateAccount, number]>, mobile?: boolean) => {
  const activeAccount = app.user.activeAccount;
  const showSnapshotOptions = app.user.activeAccount
    && app.chain?.meta.chain.snapshot.length > 0;

  const topics = app.topics.getByCommunity(
    app.activeChainId()
  ).reduce(
    (acc, current) => current.featuredInNewPost
      ? [...acc, current]
      : acc, []
  ).sort((a, b) => a.name.localeCompare(b.name));

  return [
    m(MenuItem, {
      onclick: () => { navigateToSubpage('/new/discussion'); },
      label: 'New thread',
      iconLeft: mobile ? Icons.PLUS : undefined,
    }),
    topics.map((t) => (
      m(MenuItem, {
        onclick: (e) => {
          localStorage.setItem(`${app.activeChainId()}-active-topic`, t.name);
          if (t.defaultOffchainTemplate) {
            localStorage.setItem(`${app.activeChainId()}-active-topic-default-template`, t.defaultOffchainTemplate);
          } else {
            localStorage.removeItem(`${app.activeChainId()}-active-topic-default-template`);
          }
          navigateToSubpage('/new/discussion');
        },
        label: `New ${t.name} Thread`,
        iconLeft: mobile ? Icons.PLUS : undefined,
      })
    )),
    (app.chain?.network === ChainNetwork.Aave
      || app.chain?.network === ChainNetwork.dYdX
      || app.chain?.network === ChainNetwork.Compound
      || app.chain?.base === ChainBase.CosmosSDK
      || app.chain?.base === ChainBase.Substrate)
      && !mobile
      && m(MenuDivider),
    app.chain?.base === ChainBase.CosmosSDK && m(MenuItem, {
      onclick: (e) => navigateToSubpage('/new/proposal'),
      label: 'New On-Chain Proposal',
      iconLeft: mobile ? Icons.PLUS : undefined,
    }),
    app.chain?.base === ChainBase.Ethereum && app.chain?.network === ChainNetwork.Aave
     && m(MenuItem, {
      onclick: (e) => navigateToSubpage('/new/proposal'),
      label: 'New On-Chain Proposal',
      iconLeft: mobile ? Icons.PLUS : undefined,
     }),
    app.chain?.network === ChainNetwork.Compound && m(MenuItem, {
      onclick: (e) => navigateToSubpage('/new/proposal'),
      label: 'New On-Chain Proposal',
      iconLeft: mobile ? Icons.PLUS : undefined,
    }),
    app.chain?.base === ChainBase.Substrate && app.chain?.network !== ChainNetwork.Plasm && [
      m(MenuItem, {
        onclick: (e) => navigateToSubpage('/new/proposal/:type', {
          type: ProposalType.SubstrateTreasuryProposal
        }),
        label: 'New treasury proposal',
        iconLeft: mobile ? Icons.PLUS : undefined,
      }),
      m(MenuItem, {
        onclick: (e) => navigateToSubpage('/new/proposal/:type', {
          type: ProposalType.SubstrateDemocracyProposal
        }),
        label: 'New democracy proposal',
        iconLeft: mobile ? Icons.PLUS : undefined,
      }),
      m(MenuItem, {
        class: activeAccount && (activeAccount as any).isCouncillor ? '' : 'disabled',
        onclick: (e) => navigateToSubpage('/new/proposal/:type', {
          type: ProposalType.SubstrateCollectiveProposal
        }),
        label: 'New council motion',
        iconLeft: mobile ? Icons.PLUS : undefined,
      }),
      m(MenuItem, {
        onclick: (e) => navigateToSubpage('/new/proposal/:type', {
          type: ProposalType.SubstrateBountyProposal,
        }),
        label: 'New bounty proposal',
        iconLeft: mobile ? Icons.PLUS : undefined,
      }),
      m(MenuItem, {
        onclick: (e) => navigateToSubpage('/new/proposal/:type', {
          type: ProposalType.SubstrateTreasuryTip,
        }),
        label: 'New tip',
        iconLeft: mobile ? Icons.PLUS : undefined,
      }),
    ],
    app.chain.network === ChainNetwork.Sputnik && m(MenuItem, {
      onclick: (e) => navigateToSubpage('/new/proposal'),
      label: 'New Sputnik proposal',
      iconLeft: mobile ? Icons.PLUS : undefined,
    }),
    showSnapshotOptions && m(MenuItem, {
      onclick: (e) => {
        const snapshotSpaces = app.chain.meta.chain.snapshot;
        if (snapshotSpaces.length > 1) {
          navigateToSubpage('/multiple-snapshots', {action: 'create-proposal'});
        } else {
          navigateToSubpage(`/new/snapshot/${snapshotSpaces}`);
        }
      },
      label: 'New Snapshot Proposal',
      iconLeft: mobile ? Icons.PLUS : undefined,
    }),
  ];
};

export const MobileNewProposalButton: m.Component<{

}, { councilCandidates?: Array<[SubstrateAccount, number]> }> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return;
    if (!app.chain) return;
    if (!app.activeChainId()) return;
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
    if (!app.chain) return;
    if (!app.activeChainId()) return;

    // just a button for communities, or chains without governance
    if (threadOnly) {
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
