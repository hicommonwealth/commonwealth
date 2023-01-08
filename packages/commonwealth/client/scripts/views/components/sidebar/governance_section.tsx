/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/sidebar/index.scss';

import app from 'state';
import {
  ProposalType,
  ChainBase,
  ChainNetwork,
  ChainType,
} from 'common-common/src/types';
import { handleRedirectClicks } from 'helpers';
import { SidebarSectionGroup } from './sidebar_section';
import { SectionGroupAttrs, SidebarSectionAttrs, ToggleTree } from './types';
import { verifyCachedToggleTree } from './helpers';

function setGovernanceToggleTree(path: string, toggle: boolean) {
  let currentTree = JSON.parse(
    localStorage[`${navState.activeChainId()}-governance-toggle-tree`]
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

  localStorage[`${navState.activeChainId()}-governance-toggle-tree`] =
    JSON.stringify(newTree);
}

export class GovernanceSection extends ClassComponent<SidebarSectionAttrs> {
  view() {
    // Conditional Render Details
    const hasProposals =
      app.chain &&
      (chainState.chain.base === ChainBase.CosmosSDK ||
        chainState.chain.network === ChainNetwork.Sputnik ||
        (chainState.chain.base === ChainBase.Substrate &&
          chainState.chain.network !== ChainNetwork.Plasm) ||
        chainState.chain.network === ChainNetwork.Moloch ||
        chainState.chain.network === ChainNetwork.Compound ||
        chainState.chain.network === ChainNetwork.Aave ||
        // chainState.chain.network === ChainNetwork.CommonProtocol ||
        chainState.chain.meta.snapshot?.length);

    const isNotOffchain = app.chain?.meta.type !== ChainType.Offchain;

    const showCompoundOptions =
      isNotOffchain &&
      app.user.activeAccount &&
      app.chain?.network === ChainNetwork.Compound;

    const showSnapshotOptions =
      app.chain?.base === ChainBase.Ethereum &&
      !!app.chain?.meta.snapshot?.length;

    const showReferenda =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      chainState.chain.network !== ChainNetwork.Darwinia &&
      chainState.chain.network !== ChainNetwork.HydraDX;

    const showProposals =
      (isNotOffchain &&
        app.chain?.base === ChainBase.Substrate &&
        chainState.chain.network !== ChainNetwork.Darwinia) ||
      (app.chain?.base === ChainBase.CosmosSDK &&
        chainState.chain.network !== ChainNetwork.Terra) ||
      app.chain?.network === ChainNetwork.Sputnik ||
      app.chain?.network === ChainNetwork.Moloch ||
      app.chain?.network === ChainNetwork.Compound ||
      app.chain?.network === ChainNetwork.Aave;

    const showCouncillors =
      isNotOffchain && app.chain?.base === ChainBase.Substrate;

    const showTreasury =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      chainState.chain.network !== ChainNetwork.Centrifuge;

    const showBounties =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      chainState.chain.network !== ChainNetwork.Centrifuge &&
      chainState.chain.network !== ChainNetwork.HydraDX;

    const showTips =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      chainState.chain.network !== ChainNetwork.Centrifuge;

    const showValidators =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      app.chain?.network !== ChainNetwork.Kulupu &&
      app.chain?.network !== ChainNetwork.Darwinia;

    // ---------- Build Toggle Tree ---------- //
    const governanceDefaultToggleTree: ToggleTree = {
      toggledState: false,
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
    if (!localStorage[`${navState.activeChainId()}-governance-toggle-tree`]) {
      localStorage[`${navState.activeChainId()}-governance-toggle-tree`] =
        JSON.stringify(governanceDefaultToggleTree);
    } else if (
      !verifyCachedToggleTree('governance', governanceDefaultToggleTree)
    ) {
      localStorage[`${navState.activeChainId()}-governance-toggle-tree`] =
        JSON.stringify(governanceDefaultToggleTree);
    }

    const toggleTreeState = JSON.parse(
      localStorage[`${navState.activeChainId()}-governance-toggle-tree`]
    );

    const onSnapshotProposal = (p) =>
      p.startsWith(`/${navState.activeChainId()}/snapshot`);

    const onProposalPage = (p) =>
      p.startsWith(`/${navState.activeChainId()}/proposals`) ||
      p.startsWith(
        `/${navState.activeChainId()}/proposal/${
          ProposalType.SubstrateDemocracyProposal
        }`
      );

    const onReferendaPage = (p) =>
      p.startsWith(`/${navState.activeChainId()}/referenda`) ||
      p.startsWith(
        `/${navState.activeChainId()}/proposal/${
          ProposalType.SubstrateDemocracyReferendum
        }`
      );

    const onTreasuryPage = (p) =>
      p.startsWith(`/${navState.activeChainId()}/treasury`) ||
      p.startsWith(
        `/${navState.activeChainId()}/proposal/${
          ProposalType.SubstrateTreasuryProposal
        }`
      );

    const onBountiesPage = (p) =>
      p.startsWith(`/${navState.activeChainId()}/bounties`);

    const onTipsPage = (p) =>
      p.startsWith(`/${navState.activeChainId()}/tips`) ||
      p.startsWith(
        `/${navState.activeChainId()}/proposal/${ProposalType.SubstrateTreasuryTip}`
      );

    const onCouncilPage = (p) =>
      p.startsWith(`/${navState.activeChainId()}/council`);

    const onValidatorsPage = (p) =>
      p.startsWith(`/${navState.activeChainId()}/validators`);

    const onNotificationsPage = (p) => p.startsWith('/notifications');

    const onMembersPage = (p) =>
      p.startsWith(`/${navState.activeChainId()}/members`) ||
      p.startsWith(`/${navState.activeChainId()}/account/`);

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
        (app.chain ? chainState.chain.serverLoaded : true),
      onclick: (e, toggle: boolean) => {
        handleRedirectClicks(e, '/members', navState.activeChainId(), () => {
          setGovernanceToggleTree('children.Members.toggledState', toggle);
        });
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
        const snapshotSpaces = chainState.chain.meta.snapshot;
        if (snapshotSpaces.length > 1) {
          handleRedirectClicks(
            e,
            '/multiple-snapshots?action=select-space',
            navState.activeChainId(),
            null
          );
        } else {
          if (snapshotSpaces[0].lastIndexOf('/') > -1) {
            handleRedirectClicks(
              e,
              `/snapshot/${snapshotSpaces[0]
                .slice(snapshotSpaces[0].lastIndexOf('/') + 1)
                .trim()}`,
              navState.activeChainId(),
              null
            );
          } else {
            handleRedirectClicks(
              e,
              `/snapshot/${snapshotSpaces}`,
              navState.activeChainId(),
              null
            );
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
        handleRedirectClicks(e, '/proposals', navState.activeChainId(), () => {
          setGovernanceToggleTree('children.Proposals.toggledState', toggle);
        });
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
        handleRedirectClicks(e, '/treasury', navState.activeChainId(), () => {
          setGovernanceToggleTree('children.Treasury.toggledState', toggle);
        });
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
        handleRedirectClicks(e, '/bounties', navState.activeChainId(), () => {
          setGovernanceToggleTree('children.Bounties.toggledState', toggle);
        });
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
        handleRedirectClicks(e, '/referenda', navState.activeChainId(), () => {
          setGovernanceToggleTree('children.Referenda.toggledState', toggle);
        });
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
        handleRedirectClicks(e, '/tips', navState.activeChainId(), () => {
          setGovernanceToggleTree('children.Tips.toggledState', toggle);
        });
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
        handleRedirectClicks(e, '/council', navState.activeChainId(), () => {
          setGovernanceToggleTree('children.Councillors.toggledState', toggle);
        });
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
        handleRedirectClicks(e, '/validators', navState.activeChainId(), () => {
          setGovernanceToggleTree('children.Validators.toggledState', toggle);
        });
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
      isActive: m.route.get() === `/${navState.activeChainId()}/delegate`,
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        handleRedirectClicks(e, '/delegate', navState.activeChainId(), () => {
          setGovernanceToggleTree('children.Delegate.toggledState', toggle);
        });
      },
      displayData: null,
    };

    let governanceGroupData: SectionGroupAttrs[] = [
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

    if (!hasProposals) governanceGroupData = [membersData];

    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'Governance',
      className: 'GovernanceSection',
      hasDefaultToggle: toggleTreeState['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setGovernanceToggleTree('toggledState', toggle);
      },
      displayData: governanceGroupData,
      isActive: false,
      toggleDisabled: false,
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}
