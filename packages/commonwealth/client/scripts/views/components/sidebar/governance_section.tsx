/* @jsx m */

import m from 'mithril';

import 'components/sidebar/index.scss';

import { navigateToSubpage } from 'app';
import app from 'state';
import { ProposalType, ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { SidebarSectionGroup } from './sidebar_section';
import {
  MobileSidebarSectionAttrs,
  SectionGroupAttrs,
  SidebarSectionAttrs,
  ToggleTree,
} from './types';
import { verifyCachedToggleTree } from './helpers';

function setGovernanceToggleTree(path: string, toggle: boolean) {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-governance-toggle-tree`]
  );
  const split = path.split('.');
  for (const field of split.slice(0, split.length - 1)) {
    if (Object.prototype.hasOwnProperty.call(currentTree, field)) {
      currentTree = currentTree[field];
    } else {
      return;
    }
  }
  currentTree[split[split.length - 1]] = toggle;
  const newTree = currentTree;
  localStorage[`${app.activeChainId()}-governance-toggle-tree`] =
    JSON.stringify(newTree);
}

export class GovernanceSection
  implements m.ClassComponent<MobileSidebarSectionAttrs>
{
  view(vnode) {
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
        app.chain.meta.snapshot);
    if (!hasProposals) return;

    const isNotOffchain = app.chain?.meta.type !== ChainType.Offchain;

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
      app.chain?.base === ChainBase.Ethereum &&
      app.chain?.meta.snapshot?.length > 0;
    const showReferenda =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      app.chain.network !== ChainNetwork.Darwinia &&
      app.chain.network !== ChainNetwork.HydraDX;
    const showProposals =
      (isNotOffchain &&
        app.chain?.base === ChainBase.Substrate &&
        app.chain.network !== ChainNetwork.Darwinia) ||
      (app.chain?.base === ChainBase.CosmosSDK &&
        app.chain.network !== ChainNetwork.Terra) ||
      app.chain?.network === ChainNetwork.Sputnik ||
      app.chain?.network === ChainNetwork.Moloch ||
      app.chain?.network === ChainNetwork.Compound ||
      app.chain?.network === ChainNetwork.Aave;
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
    const governanceDefaultToggleTree: ToggleTree = {
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
        JSON.stringify(governanceDefaultToggleTree);
    } else if (
      !verifyCachedToggleTree('governance', governanceDefaultToggleTree)
    ) {
      console.log(
        'setting discussions toggle tree since the cached version differs from the updated version'
      );
      localStorage[`${app.activeChainId()}-governance-toggle-tree`] =
        JSON.stringify(governanceDefaultToggleTree);
    }
    let toggleTreeState = JSON.parse(
      localStorage[`${app.activeChainId()}-governance-toggle-tree`]
    );
    if (vnode.attrs.mobile) {
      toggleTreeState = governanceDefaultToggleTree;
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
    const membersData: SectionGroupAttrs = {
      title: 'Members',
      containsChildren: false,
      hasDefaultToggle: toggleTreeState['children']['Members']['toggledState'],
      isVisible: true,
      isUpdated: true,
      isActive:
        onMembersPage(m.route.get()) &&
        (app.chain ? app.chain.serverLoaded : true),
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Members.toggledState', toggle);
        navigateToSubpage('/members');
      },
      displayData: null,
    };

    // Snapshots
    const snapshotData: SectionGroupAttrs = {
      title: 'Snapshots',
      containsChildren: false,
      hasDefaultToggle: showSnapshotOptions
        ? toggleTreeState['children']['Snapshots']['toggledState']
        : false,
      isVisible: showSnapshotOptions,
      isActive: onSnapshotProposal(m.route.get()),
      isUpdated: true,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Snapshots.toggledState', toggle);
        // Check if we have multiple snapshots for conditional redirect
        const snapshotSpaces = app.chain.meta.snapshot;
        if (snapshotSpaces.length > 1) {
          navigateToSubpage('/multiple-snapshots', { action: 'select-space' });
        } else {
          if (snapshotSpaces[0].lastIndexOf('/') > -1) {
            navigateToSubpage(
              `/snapshot/${snapshotSpaces[0]
                .slice(snapshotSpaces[0].lastIndexOf('/') + 1)
                .trim()}`
            );
          } else {
            navigateToSubpage(`/snapshot/${snapshotSpaces}`);
          }
        }
      },
      displayData: null,
    };

    // Proposals
    const proposalsData: SectionGroupAttrs = {
      title: 'Proposals',
      containsChildren: false,
      hasDefaultToggle: showProposals
        ? toggleTreeState['children']['Proposals']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/proposals');
        setGovernanceToggleTree('children.Proposals.toggledState', toggle);
      },
      isVisible: showProposals,
      isUpdated: true,
      isActive: onProposalPage(m.route.get()),
      displayData: null,
    };

    // Treasury
    const treasuryData: SectionGroupAttrs = {
      title: 'Treasury',
      containsChildren: false,
      hasDefaultToggle: showTreasury
        ? toggleTreeState['children']['Treasury']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/treasury');
        setGovernanceToggleTree('children.Treasury.toggledState', toggle);
      },
      isVisible: showTreasury,
      isUpdated: true,
      isActive: onTreasuryPage(m.route.get()),
      displayData: null,
    };

    const bountyData: SectionGroupAttrs = {
      title: 'Bounties',
      containsChildren: false,
      hasDefaultToggle: showBounties
        ? toggleTreeState['children']['Bounties']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/bounties');
        setGovernanceToggleTree('children.Bounties.toggledState', toggle);
      },
      isVisible: showBounties,
      isUpdated: true,
      isActive: onBountiesPage(m.route.get()),
      displayData: null,
    };

    const referendaData: SectionGroupAttrs = {
      title: 'Referenda',
      containsChildren: false,
      hasDefaultToggle: showReferenda
        ? toggleTreeState['children']['Referenda']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/referenda');
        setGovernanceToggleTree('children.Referenda.toggledState', toggle);
      },
      isVisible: showReferenda,
      isUpdated: true,
      isActive: onReferendaPage(m.route.get()),
      displayData: null,
    };

    const tipsData: SectionGroupAttrs = {
      title: 'Tips',
      containsChildren: false,
      hasDefaultToggle: showTips
        ? toggleTreeState['children']['Tips']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/tips');
        setGovernanceToggleTree('children.Tips.toggledState', toggle);
      },
      isVisible: showTips,
      isUpdated: true,
      isActive: onTipsPage(m.route.get()),
      displayData: null,
    };

    const councillorsData: SectionGroupAttrs = {
      title: 'Councillors',
      containsChildren: false,
      hasDefaultToggle: showCouncillors
        ? toggleTreeState['children']['Councillors']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/council');
        setGovernanceToggleTree('children.Councillors.toggledState', toggle);
      },
      isVisible: showCouncillors,
      isUpdated: true,
      isActive: onCouncilPage(m.route.get()),
      displayData: null,
    };

    const validatorsData: SectionGroupAttrs = {
      title: 'Validators',
      containsChildren: false,
      hasDefaultToggle: showValidators
        ? toggleTreeState['children']['Validators']['toggledState']
        : false,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        navigateToSubpage('/validators');
        setGovernanceToggleTree('children.Validators.toggledState', toggle);
      },
      isVisible: showValidators,
      isUpdated: true,
      isActive: onValidatorsPage(m.route.get()),
      displayData: null,
    };

    // Delegate
    const delegateData: SectionGroupAttrs = {
      title: 'Delegate',
      containsChildren: false,
      hasDefaultToggle: showCompoundOptions
        ? toggleTreeState['children']['Delegate']['toggledState']
        : false,
      isVisible: showCompoundOptions,
      isUpdated: true,
      isActive: m.route.get() === `/${app.activeChainId()}/delegate`,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('children.Delegate.toggledState', toggle);
        navigateToSubpage('/delegate');
      },
      displayData: null,
    };

    const governanceGroupData: SectionGroupAttrs[] = [
      membersData,
      snapshotData,
      delegateData,
      treasuryData,
      bountyData,
      referendaData,
      proposalsData,
      tipsData,
      councillorsData,
      validatorsData,
    ];

    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'GOVERNANCE',
      hasDefaultToggle: toggleTreeState['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('toggledState', toggle);
      },
      displayData: governanceGroupData,
      isActive: false,
      toggleDisabled: vnode.attrs.mobile,
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}
