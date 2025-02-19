import React from 'react';

import { ChainBase, ChainNetwork, ChainType } from '@hicommonwealth/shared';

import { handleRedirectClicks } from 'helpers';
import './index.scss';

import { useFlag } from 'client/scripts/hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import { matchRoutes, useLocation } from 'react-router-dom';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { sidebarStore } from 'state/ui/sidebar';
import { isWindowSmallInclusive } from '../component_kit/helpers';
import { verifyCachedToggleTree } from './helpers';
import { SidebarSectionGroup } from './sidebar_section';
import type {
  SectionGroupAttrs,
  SidebarSectionAttrs,
  ToggleTree,
} from './types';
interface AppSectionProps {
  isContestAvailable: boolean;
}
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

export const GovernanceSection = ({ isContestAvailable }: AppSectionProps) => {
  const governancePageEnabled = useFlag('governancePage');

  const navigate = useCommonNavigate();
  const location = useLocation();

  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  // Conditional Render Details
  const hasProposals =
    app.chain &&
    (app.chain.base === ChainBase.CosmosSDK ||
      community?.snapshot_spaces?.length);

  const isNotOffchain = app.chain?.meta?.type !== ChainType.Offchain;

  const showSnapshotOptions =
    app.chain?.base === ChainBase.Ethereum &&
    !!community?.snapshot_spaces?.length;

  const showProposals =
    isNotOffchain &&
    app.chain?.base === ChainBase.CosmosSDK &&
    app.chain.network !== ChainNetwork.Terra;

  // ---------- Build Toggle Tree ---------- //
  const governanceDefaultToggleTree: ToggleTree = {
    toggledState: false,
    children: {
      Members: {
        toggledState: false,
        children: {},
      },
      Governance: {
        toggledState: false,
        children: {},
      },
      ...(showSnapshotOptions && {
        Snapshots: {
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
      ...(isContestAvailable && {
        Contests: {
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

  const matchesMembersRoute = matchRoutes(
    [{ path: '/members' }, { path: ':scope/members' }],
    location,
  );
  const matchesContestsRoute = matchRoutes(
    [{ path: '/contests' }, { path: ':scope/contests' }],
    location,
  );
  const matchesGovernanceRoute = matchRoutes(
    [{ path: '/governance' }, { path: ':scope/governance' }],
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
      handleRedirectClicks(navigate, e, '/members', communityId, () => {
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
      const snapshotSpaces = community?.snapshot_spaces || [];
      if (snapshotSpaces.length > 1) {
        handleRedirectClicks(
          navigate,
          e,
          '/multiple-snapshots?action=select-space',
          communityId,
          // @ts-expect-error <StrictNullChecks/>
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
            communityId,
            // @ts-expect-error <StrictNullChecks/>
            null,
          );
        } else {
          handleRedirectClicks(
            navigate,
            e,
            `/snapshot/${snapshotSpaces}`,
            communityId,
            // @ts-expect-error <StrictNullChecks/>
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
      handleRedirectClicks(navigate, e, '/proposals', communityId, () => {
        setGovernanceToggleTree('children.Proposals.toggledState', toggle);
      });
    },
    isVisible: showProposals,
    isUpdated: true,
    isActive: !!matchesProposalRoute,
    displayData: null,
  };

  // Governance
  const governanceData: SectionGroupAttrs = {
    title: 'Governance',
    containsChildren: false,
    hasDefaultToggle: toggleTreeState['children']['Governance']
      ? toggleTreeState['children']['Governance']['toggledState']
      : false,
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      resetSidebarState();
      handleRedirectClicks(navigate, e, '/governance', communityId, () => {
        setGovernanceToggleTree('children.Governance.toggledState', toggle);
      });
    },
    isVisible: true,
    isUpdated: true,
    isActive: !!matchesGovernanceRoute,
    displayData: null,
  };

  // Contests
  const contestData: SectionGroupAttrs = {
    title: 'Contests',
    containsChildren: false,
    displayData: null,
    hasDefaultToggle: false,
    isActive: !!matchesContestsRoute,
    isVisible: isContestAvailable,
    isUpdated: true,
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      resetSidebarState();
      handleRedirectClicks(navigate, e, `/contests`, communityId, () => {
        setGovernanceToggleTree('children.Contests.toggledState', toggle);
      });
    },
  };
  let governanceGroupData: SectionGroupAttrs[] = [
    membersData,
    snapshotData,
    proposalsData,
  ];

  if (!hasProposals) governanceGroupData = [membersData];
  if (isContestAvailable) {
    governanceGroupData.push(contestData);
  }
  if (governancePageEnabled) {
    governanceGroupData.push(governanceData);
  }

  const sidebarSectionData: SidebarSectionAttrs = {
    title: 'Apps',
    className: 'AppsSection',
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
