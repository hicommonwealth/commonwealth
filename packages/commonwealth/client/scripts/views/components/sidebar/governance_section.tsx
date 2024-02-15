import React from 'react';

import { ChainBase, ChainNetwork, ChainType } from '@hicommonwealth/core';

import 'components/sidebar/index.scss';
import { handleRedirectClicks } from 'helpers';

import { useCommonNavigate } from 'navigation/helpers';
import { matchRoutes, useLocation } from 'react-router-dom';
import app from 'state';
import { sidebarStore } from 'state/ui/sidebar';
import { isWindowSmallInclusive } from '../component_kit/helpers';
import { isGovernorCountingSimple, verifyCachedToggleTree } from './helpers';
import { SidebarSectionGroup } from './sidebar_section';
import type {
  SectionGroupAttrs,
  SidebarSectionAttrs,
  ToggleTree,
} from './types';

const resetSidebarState = () => {
  if (isWindowSmallInclusive(window.innerWidth)) {
    sidebarStore.getState().setMenu({ name: 'default', isVisible: false });
  } else {
    sidebarStore.getState().setMenu({ name: 'default', isVisible: true });
  }
};

function setGovernanceToggleTree(path: string, toggle: boolean) {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-governance-toggle-tree`],
  );

  const split = path.split('.');

  for (const field of split.slice(0, split.length - 1)) {
    if (Object.prototype.hasOwnProperty.call(currentTree, field)) {
      currentTree = currentTree[field];
    } else {
      return;
    }
  }

  currentTree[split[split.length - 1]] = !toggle;

  const newTree = currentTree;

  localStorage[`${app.activeChainId()}-governance-toggle-tree`] =
    JSON.stringify(newTree);
}

export const GovernanceSection = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();

  // Conditional Render Details
  const hasProposals =
    app.chain &&
    (app.chain.base === ChainBase.CosmosSDK ||
      app.chain.network === ChainNetwork.Sputnik ||
      app.chain.network === ChainNetwork.Compound ||
      app.chain.network === ChainNetwork.Aave ||
      // app.chain.network === ChainNetwork.CommonProtocol ||
      app.chain.meta.snapshot?.length);

  const isNotOffchain = app.chain?.meta.type !== ChainType.Offchain;
  const compoundContracts = app.contracts.getByType('compound');

  const showCompoundOptions =
    isNotOffchain &&
    app.user.activeAccount &&
    app.chain?.network === ChainNetwork.Compound &&
    !(
      compoundContracts.length > 0 &&
      isGovernorCountingSimple(compoundContracts[0])
    );

  const showSnapshotOptions =
    app.chain?.base === ChainBase.Ethereum &&
    !!app.chain?.meta.snapshot?.length;

  const showProposals =
    (isNotOffchain &&
      app.chain?.base === ChainBase.CosmosSDK &&
      app.chain.network !== ChainNetwork.Terra) ||
    app.chain?.network === ChainNetwork.Sputnik ||
    app.chain?.network === ChainNetwork.Compound ||
    app.chain?.network === ChainNetwork.Aave;

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
      ...(showProposals && {
        Proposals: {
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
    localStorage[`${app.activeChainId()}-governance-toggle-tree`],
  );

  const matchesSnapshotProposalRoute = matchRoutes(
    [{ path: '/snapshot/:space' }, { path: ':scope/snapshot/:space' }],
    location,
  );

  const matchesProposalRoute = matchRoutes(
    [{ path: '/proposals' }, { path: ':scope/proposals' }],
    location,
  );

  const matchesDelegateRoute = matchRoutes(
    [{ path: '/delegate' }, { path: ':scope/delegate' }],
    location,
  );

  const matchesMembersRoute = matchRoutes(
    [{ path: '/members' }, { path: ':scope/members' }],
    location,
  );

  // ---------- Build Section Props ---------- //

  // Members
  const membersData: SectionGroupAttrs = {
    title: 'Members',
    containsChildren: false,
    hasDefaultToggle: toggleTreeState['children']['Members']['toggledState'],
    isVisible: true,
    isUpdated: true,
    isActive:
      !!matchesMembersRoute && (app.chain ? app.chain.serverLoaded : true),
    onClick: (e, toggle: boolean) => {
      resetSidebarState();
      handleRedirectClicks(navigate, e, '/members', app.activeChainId(), () => {
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
    isActive: !!matchesSnapshotProposalRoute,
    isUpdated: true,
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      setGovernanceToggleTree('children.Snapshots.toggledState', toggle);
      resetSidebarState();
      // Check if we have multiple snapshots for conditional redirect
      const snapshotSpaces = app.chain.meta.snapshot;
      if (snapshotSpaces.length > 1) {
        handleRedirectClicks(
          navigate,
          e,
          '/multiple-snapshots?action=select-space',
          app.activeChainId(),
          null,
        );
      } else {
        if (snapshotSpaces[0].lastIndexOf('/') > -1) {
          handleRedirectClicks(
            navigate,
            e,
            `/snapshot/${snapshotSpaces[0]
              .slice(snapshotSpaces[0].lastIndexOf('/') + 1)
              .trim()}`,
            app.activeChainId(),
            null,
          );
        } else {
          handleRedirectClicks(
            navigate,
            e,
            `/snapshot/${snapshotSpaces}`,
            app.activeChainId(),
            null,
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
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      resetSidebarState();
      handleRedirectClicks(
        navigate,
        e,
        '/proposals',
        app.activeChainId(),
        () => {
          setGovernanceToggleTree('children.Proposals.toggledState', toggle);
        },
      );
    },
    isVisible: showProposals,
    isUpdated: true,
    isActive: !!matchesProposalRoute,
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
    isActive: !!matchesDelegateRoute,
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      handleRedirectClicks(
        navigate,
        e,
        '/delegate',
        app.activeChainId(),
        () => {
          setGovernanceToggleTree('children.Delegate.toggledState', toggle);
        },
      );
    },
    displayData: null,
  };

  let governanceGroupData: SectionGroupAttrs[] = [
    membersData,
    snapshotData,
    delegateData,
    proposalsData,
  ];

  if (!hasProposals) governanceGroupData = [membersData];

  const sidebarSectionData: SidebarSectionAttrs = {
    title: 'Governance',
    className: 'GovernanceSection',
    hasDefaultToggle: toggleTreeState['toggledState'],
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      setGovernanceToggleTree('toggledState', toggle);
    },
    displayData: governanceGroupData,
    isActive: false,
    toggleDisabled: false,
  };

  return <SidebarSectionGroup {...sidebarSectionData} />;
};
