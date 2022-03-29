/* eslint-disable @typescript-eslint/ban-types */
import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import { navigateToSubpage } from 'app';
import app from 'state';
import { ProposalType, ChainBase, ChainNetwork, ChainType } from 'types';
import SidebarSection, {
  SectionGroupProps,
  SidebarSectionProps,
} from './sidebar_section';
import { ToggleTree, verifyCachedToggleTree } from '.';

export const GovernanceSection: m.Component<{ mobile: boolean }, {}> = {
  view: (vnode) => {
    // Conditional Render Details
    const hasProposals =
      app.chain &&
      (app.chain.base === ChainBase.CosmosSDK ||
        app.chain.network === ChainNetwork.Sputnik ||
        (app.chain.base === ChainBase.Substrate &&
          app.chain.network !== ChainNetwork.Plasm) ||
        app.chain.network === ChainNetwork.Moloch ||
        app.chain.network === ChainNetwork.Compound ||
        app.chain.network === ChainNetwork.Aave ||
        app.chain.network === ChainNetwork.Commonwealth ||
        app.chain.meta.chain.snapshot);
    if (!hasProposals) return;

    const isNotOffchain = app.chain?.meta.chain.type !== ChainType.Offchain;

    const showMolochMenuOptions =
      isNotOffchain &&
      app.user.activeAccount &&
      app.chain?.network === ChainNetwork.Moloch;
    const showMolochMemberOptions =
      isNotOffchain &&
      showMolochMenuOptions &&
      (app.user.activeAccount as any)?.shares?.gtn(0);
    const showCommonwealthMenuOptions =
      isNotOffchain && app.chain?.network === ChainNetwork.Commonwealth;
    const showCompoundOptions =
      isNotOffchain &&
      app.user.activeAccount &&
      app.chain?.network === ChainNetwork.Compound;
    const showAaveOptions =
      isNotOffchain &&
      app.user.activeAccount &&
      app.chain?.network === ChainNetwork.Aave;
    const showSnapshotOptions =
      isNotOffchain && app.chain?.meta.chain.snapshot.length > 0;
    const showReferenda =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      app.chain.network !== ChainNetwork.Darwinia &&
      app.chain.network !== ChainNetwork.HydraDX;
    const showProposals =
      isNotOffchain &&
      ((app.chain?.base === ChainBase.Substrate &&
        app.chain.network !== ChainNetwork.Darwinia) ||
        app.chain?.base === ChainBase.CosmosSDK ||
        app.chain?.network === ChainNetwork.Sputnik ||
        app.chain?.network === ChainNetwork.Moloch ||
        app.chain?.network === ChainNetwork.Compound ||
        app.chain?.network === ChainNetwork.Aave);
    const showCouncillors =
      isNotOffchain && app.chain?.base === ChainBase.Substrate;
    const showTreasury =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      app.chain.network !== ChainNetwork.Centrifuge;
    const showBounties =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      app.chain.network !== ChainNetwork.Centrifuge &&
      app.chain.network !== ChainNetwork.HydraDX;
    const showTips =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      app.chain.network !== ChainNetwork.Centrifuge;
    const showValidators =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      app.chain?.network !== ChainNetwork.Kulupu &&
      app.chain?.network !== ChainNetwork.Darwinia;

    // ---------- Build Toggle Tree ---------- //
    const governance_default_toggleTree: ToggleTree = {
      toggledState: true,
      children: {
        Members: {
          toggledState: false,
          children: {},
        },
        ...(showSnapshotOptions && {
          Snapshots: {
            toggledState: false,
            children: {},
          },
        }),
        ...(showCompoundOptions && {
          Delegate: {
            toggledState: true,
            children: {},
          },
        }),
        ...(showTreasury && {
          Treasury: {
            toggledState: false,
            children: {},
          },
        }),
        ...(showBounties && {
          Bounties: {
            toggledState: false,
            children: {},
          },
        }),
        ...(showReferenda && {
          Referenda: {
            toggledState: false,
            children: {},
          },
        }),
        ...(showProposals && {
          Proposals: {
            toggledState: false,
            children: {},
          },
        }),
        ...(showTips && {
          Tips: {
            toggledState: false,
            children: {},
          },
        }),
        ...(showCouncillors && {
          Councillors: {
            toggledState: false,
            children: {},
          },
        }),
        ...(showValidators && {
          Validators: {
            toggledState: false,
            children: {},
          },
        }),
      },
    };

    // Check if an existing toggle tree is stored
    if (!localStorage[`${app.activeChainId()}-governance-toggle-tree`]) {
      console.log('setting toggle tree from scratch');
      localStorage[`${app.activeChainId()}-governance-toggle-tree`] =
        JSON.stringify(governance_default_toggleTree);
    } else if (
      !verifyCachedToggleTree('governance', governance_default_toggleTree)
    ) {
      console.log(
        'setting discussions toggle tree since the cached version differs from the updated version'
      );
      localStorage[`${app.activeChainId()}-governance-toggle-tree`] =
        JSON.stringify(governance_default_toggleTree);
    }
    let toggleTree_state = JSON.parse(
      localStorage[`${app.activeChainId()}-governance-toggle-tree`]
    );
    if (vnode.attrs.mobile) {
      toggleTree_state = governance_default_toggleTree;
    }

    const onSnapshotProposal = (p) =>
      p.startsWith(`/${app.activeChainId()}/snapshot`);
    const onSnapshotProposalCreation = (p) =>
      p.startsWith(`/${app.activeChainId()}/new/snapshot/`);
    const onProposalPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/proposals`) ||
      p.startsWith(
        `/${app.activeChainId()}/proposal/${
          ProposalType.SubstrateDemocracyProposal
        }`
      );
    const onReferendaPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/referenda`) ||
      p.startsWith(
        `/${app.activeChainId()}/proposal/${
          ProposalType.SubstrateDemocracyReferendum
        }`
      );
    const onTreasuryPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/treasury`) ||
      p.startsWith(
        `/${app.activeChainId()}/proposal/${
          ProposalType.SubstrateTreasuryProposal
        }`
      );
    const onBountiesPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/bounties`);
    const onTipsPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/tips`) ||
      p.startsWith(
        `/${app.activeChainId()}/proposal/${ProposalType.SubstrateTreasuryTip}`
      );
    const onCouncilPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/council`);
    const onMotionPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/motions`) ||
      p.startsWith(
        `/${app.activeChainId()}/proposal/${
          ProposalType.SubstrateCollectiveProposal
        }`
      );
    const onValidatorsPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/validators`);
    const onNotificationsPage = (p) => p.startsWith('/notifications');
    const onMembersPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/members`) ||
      p.startsWith(`/${app.activeChainId()}/account/`);

    if (onNotificationsPage(m.route.get())) return;

    // ---------- Build Section Props ---------- //

    // Members
    const members_data: SectionGroupProps = {
      title: 'Members',
      contains_children: false,
      default_toggle: toggleTree_state['children']['Members']['toggledState'],
      is_visible: true,
      is_updated: true,
      is_active:
        onMembersPage(m.route.get()) &&
        (app.chain ? app.chain.serverLoaded : true),
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Members.toggledState', toggle);
        navigateToSubpage('/members');
      },
      display_data: null,
    };

    // Snapshots
    const snapshot_data: SectionGroupProps = {
      title: 'Snapshots',
      contains_children: false,
      default_toggle: showSnapshotOptions
        ? toggleTree_state['children']['Snapshots']['toggledState']
        : false,
      is_visible: showSnapshotOptions,
      is_active: onSnapshotProposal(m.route.get()),
      is_updated: true,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Snapshots.toggledState', toggle);
        // Check if we have multiple snapshots for conditional redirect
        const snapshotSpaces = app.chain.meta.chain.snapshot;
        if (snapshotSpaces.length > 1) {
          navigateToSubpage('/multiple-snapshots', { action: 'select-space' });
        } else {
          navigateToSubpage(`/snapshot/${snapshotSpaces}`);
        }
      },
      display_data: null,
    };

    // Proposals
    const proposals_data: SectionGroupProps = {
      title: 'Proposals',
      contains_children: false,
      default_toggle: showProposals
        ? toggleTree_state['children']['Proposals']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/proposals');
        setGovernanceToggleTree('children.Proposals.toggledState', toggle);
      },
      is_visible: showProposals,
      is_updated: true,
      is_active: onProposalPage(m.route.get()),
      display_data: null,
    };

    // Treasury
    const treasury_data: SectionGroupProps = {
      title: 'Treasury',
      contains_children: false,
      default_toggle: showTreasury
        ? toggleTree_state['children']['Treasury']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/treasury');
        setGovernanceToggleTree('children.Treasury.toggledState', toggle);
      },
      is_visible: showTreasury,
      is_updated: true,
      is_active: onTreasuryPage(m.route.get()),
      display_data: null,
    };

    const bounty_data: SectionGroupProps = {
      title: 'Bounties',
      contains_children: false,
      default_toggle: showBounties
        ? toggleTree_state['children']['Bounties']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/bounties');
        setGovernanceToggleTree('children.Bounties.toggledState', toggle);
      },
      is_visible: showBounties,
      is_updated: true,
      is_active: onBountiesPage(m.route.get()),
      display_data: null,
    };

    const referenda_data: SectionGroupProps = {
      title: 'Referenda',
      contains_children: false,
      default_toggle: showReferenda
        ? toggleTree_state['children']['Referenda']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/referenda');
        setGovernanceToggleTree('children.Referenda.toggledState', toggle);
      },
      is_visible: showReferenda,
      is_updated: true,
      is_active: onReferendaPage(m.route.get()),
      display_data: null,
    };

    const tips_data: SectionGroupProps = {
      title: 'Tips',
      contains_children: false,
      default_toggle: showTips
        ? toggleTree_state['children']['Tips']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/tips');
        setGovernanceToggleTree('children.Tips.toggledState', toggle);
      },
      is_visible: showTips,
      is_updated: true,
      is_active: onTipsPage(m.route.get()),
      display_data: null,
    };

    const councillors_data: SectionGroupProps = {
      title: 'Councillors',
      contains_children: false,
      default_toggle: showCouncillors
        ? toggleTree_state['children']['Councillors']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/council');
        setGovernanceToggleTree('children.Councillors.toggledState', toggle);
      },
      is_visible: showCouncillors,
      is_updated: true,
      is_active: onCouncilPage(m.route.get()),
      display_data: null,
    };

    const validators_data: SectionGroupProps = {
      title: 'Validators',
      contains_children: false,
      default_toggle: showValidators
        ? toggleTree_state['children']['Validators']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/validators');
        setGovernanceToggleTree('children.Validators.toggledState', toggle);
      },
      is_visible: showValidators,
      is_updated: true,
      is_active: onValidatorsPage(m.route.get()),
      display_data: null,
    };

    // Delegate
    const delegate_data: SectionGroupProps = {
      title: 'Delegate',
      contains_children: false,
      default_toggle: showCompoundOptions
        ? toggleTree_state['children']['Delegate']['toggledState']
        : false,
      is_visible: showCompoundOptions,
      is_updated: true,
      is_active: m.route.get() === `/${app.activeChainId()}/delegate`,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Delegate.toggledState', toggle);
        navigateToSubpage('/delegate');
      },
      display_data: null,
    };

    const governance_group_data: SectionGroupProps[] = [
      members_data,
      snapshot_data,
      delegate_data,
      treasury_data,
      bounty_data,
      referenda_data,
      proposals_data,
      tips_data,
      councillors_data,
      validators_data,
    ];

    const sidebar_section_data: SidebarSectionProps = {
      title: 'GOVERNANCE',
      default_toggle: toggleTree_state['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('toggledState', toggle);
      },
      display_data: governance_group_data,
      is_active: false,
      toggle_disabled: vnode.attrs.mobile,
    };

    return m(SidebarSection, { ...sidebar_section_data });
  },
};

function setGovernanceToggleTree(path: string, toggle: boolean) {
  let current_tree = JSON.parse(
    localStorage[`${app.activeChainId()}-governance-toggle-tree`]
  );
  const split = path.split('.');
  for (const field of split.slice(0, split.length - 1)) {
    if (current_tree.hasOwnProperty(field)) {
      current_tree = current_tree[field];
    } else {
      return;
    }
  }
  current_tree[split[split.length - 1]] = toggle;
  const new_tree = current_tree;
  localStorage[`${app.activeChainId()}-governance-toggle-tree`] =
    JSON.stringify(new_tree);
}
