/* @jsx m */

import ClassComponent from 'class_component';
import {
  ChainBase,
  ChainNetwork,
  ChainType,
  ProposalType,
} from 'common-common/src/types';

import 'components/sidebar/index.scss';
import { handleRedirectClicks } from 'helpers';
import m from 'mithril';

import app from 'state';
import { verifyCachedToggleTree } from './helpers';
import { SidebarSectionGroup } from './sidebar_section';
import type {
  SectionGroupAttrs,
  SidebarSectionAttrs,
  ToggleTree,
} from './types';

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

export class GovernanceSection extends ClassComponent<SidebarSectionAttrs> {
  view() {
    // Conditional Render Details
    const hasProposals =
      app.chain &&
      (app.chain.base === ChainBase.CosmosSDK ||
        app.chain.network === ChainNetwork.Sputnik ||
        (app.chain.base === ChainBase.Substrate &&
          app.chain.network !== ChainNetwork.Plasm) ||
        app.chain.network === ChainNetwork.Compound ||
        app.chain.network === ChainNetwork.Aave ||
        // app.chain.network === ChainNetwork.CommonProtocol ||
        app.chain.meta.snapshot?.length);

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
      app.chain.network !== ChainNetwork.Darwinia &&
      app.chain.network !== ChainNetwork.HydraDX;

    const showProposals =
      (isNotOffchain &&
        app.chain?.base === ChainBase.Substrate &&
        app.chain.network !== ChainNetwork.Darwinia) ||
      (app.chain?.base === ChainBase.CosmosSDK &&
        app.chain.network !== ChainNetwork.Terra) ||
      app.chain?.network === ChainNetwork.Sputnik ||
      app.chain?.network === ChainNetwork.Compound ||
      app.chain?.network === ChainNetwork.Aave;

    const showTreasury =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      app.chain.network !== ChainNetwork.Centrifuge;

    const showTips =
      isNotOffchain &&
      app.chain?.base === ChainBase.Substrate &&
      app.chain.network !== ChainNetwork.Centrifuge;

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
      },
    };

    // Check if an existing toggle tree is stored
    if (!localStorage[`${app.activeChainId()}-governance-toggle-tree`]) {
      localStorage[`${app.activeChainId()}-governance-toggle-tree`] =
        JSON.stringify(governanceDefaultToggleTree);
    } else if (
      !verifyCachedToggleTree('governance', governanceDefaultToggleTree)
    ) {
      localStorage[`${app.activeChainId()}-governance-toggle-tree`] =
        JSON.stringify(governanceDefaultToggleTree);
    }

    const toggleTreeState = JSON.parse(
      localStorage[`${app.activeChainId()}-governance-toggle-tree`]
    );

    const onSnapshotProposal = (p) =>
      p.startsWith(`/${app.activeChainId()}/snapshot`);

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

    const onTipsPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/tips`) ||
      p.startsWith(
        `/${app.activeChainId()}/proposal/${ProposalType.SubstrateTreasuryTip}`
      );

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
        handleRedirectClicks(e, '/members', app.activeChainId(), () => {
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
        const snapshotSpaces = app.chain.meta.snapshot;
        if (snapshotSpaces.length > 1) {
          handleRedirectClicks(
            e,
            '/multiple-snapshots?action=select-space',
            app.activeChainId(),
            null
          );
        } else {
          if (snapshotSpaces[0].lastIndexOf('/') > -1) {
            handleRedirectClicks(
              e,
              `/snapshot/${snapshotSpaces[0]
                .slice(snapshotSpaces[0].lastIndexOf('/') + 1)
                .trim()}`,
              app.activeChainId(),
              null
            );
          } else {
            handleRedirectClicks(
              e,
              `/snapshot/${snapshotSpaces}`,
              app.activeChainId(),
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
        handleRedirectClicks(e, '/proposals', app.activeChainId(), () => {
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
        handleRedirectClicks(e, '/treasury', app.activeChainId(), () => {
          setGovernanceToggleTree('children.Treasury.toggledState', toggle);
        });
      },
      isVisible: showTreasury,
      isUpdated: true,
      isActive: onTreasuryPage(m.route.get()),
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
        handleRedirectClicks(e, '/referenda', app.activeChainId(), () => {
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
        handleRedirectClicks(e, '/tips', app.activeChainId(), () => {
          setGovernanceToggleTree('children.Tips.toggledState', toggle);
        });
      },
      isVisible: showTips,
      isUpdated: true,
      isActive: onTipsPage(m.route.get()),
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
        handleRedirectClicks(e, '/delegate', app.activeChainId(), () => {
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
      referendaData,
      proposalsData,
      tipsData,
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
