import React from 'react';

import { handleRedirectClicks } from 'helpers';
import { featureFlags } from 'helpers/feature-flags';
import { useCommonNavigate } from 'navigation/helpers';
import { matchRoutes, useLocation } from 'react-router-dom';
import app from 'state';
import { sidebarStore } from 'state/ui/sidebar';
import { isWindowSmallInclusive } from '../component_kit/helpers';
import { verifyCachedToggleTree } from './helpers';
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

const setAdminToggleTree = (path: string, toggle: boolean) => {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-admin-toggle-tree`],
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

  localStorage[`${app.activeChainId()}-admin-toggle-tree`] =
    JSON.stringify(newTree);
};

const AdminSection = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();

  const matchesCommunityProfileRoute = matchRoutes(
    [{ path: '/community-profile' }, { path: ':scope/community-profile' }],
    location,
  );
  const matchesCommunityIntegrationsRoute = matchRoutes(
    [
      { path: '/community-integrations' },
      { path: ':scope/community-integrations' },
    ],
    location,
  );
  const matchesCommunityTopicsRoute = matchRoutes(
    [{ path: '/community-topics' }, { path: ':scope/community-topics' }],
    location,
  );
  const matchesCommunityModeratorsRoute = matchRoutes(
    [
      { path: '/community-moderators' },
      { path: ':scope/community-moderators' },
    ],
    location,
  );
  const matchesAnalyticsRoute = matchRoutes(
    [{ path: '/analytics' }, { path: ':scope/analytics' }],
    location,
  );
  const matchesContractsRoute = matchRoutes(
    [{ path: '/contracts' }, { path: ':scope/contracts' }],
    location,
  );

  const adminGroupData: SectionGroupAttrs[] = [
    {
      title: 'Community Profile',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: !!matchesCommunityProfileRoute,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/community-profile`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.manageCommunity.toggledState`, toggle);
          },
        );
      },
    },
    {
      title: 'Integrations',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: !!matchesCommunityIntegrationsRoute,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/community-integrations`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.manageCommunity.toggledState`, toggle);
          },
        );
      },
    },
    {
      title: 'Topics',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: !!matchesCommunityTopicsRoute,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/community-topics`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.manageCommunity.toggledState`, toggle);
          },
        );
      },
    },
    {
      title: 'Admins & Moderators',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: !!matchesCommunityModeratorsRoute,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/community-moderators`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.manageCommunity.toggledState`, toggle);
          },
        );
      },
    },
    {
      title: 'Members & Groups',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: false,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/members`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.manageCommunity.toggledState`, toggle);
          },
        );
      },
    },
    {
      title: 'Analytics',
      containsChildren: false,
      displayData: null,
      hasDefaultToggle: false,
      isActive: !!matchesAnalyticsRoute,
      isVisible: true,
      isUpdated: false,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/analytics`,
          app.activeChainId(),
          () => {
            setAdminToggleTree(`children.analytics.toggledState`, toggle);
          },
        );
      },
    },
    ...(featureFlags.proposalTemplates
      ? [
          {
            title: 'Contract Templates',
            containsChildren: false,
            displayData: null,
            hasDefaultToggle: false,
            isActive: !!matchesContractsRoute,
            isVisible: true,
            isUpdated: false,
            onClick: (e, toggle: boolean) => {
              e.preventDefault();
              resetSidebarState();
              handleRedirectClicks(
                navigate,
                e,
                `/contracts`,
                app.activeChainId(),
                () => {
                  setAdminToggleTree(`children.contracts.toggledState`, toggle);
                },
              );
            },
          },
        ]
      : []),
  ];

  // Build Toggle Tree
  const adminDefaultToggleTree: ToggleTree = {
    toggledState: false,
    children: {},
  };

  // Check if an existing toggle tree is stored
  if (!localStorage[`${app.activeChainId()}-admin-toggle-tree`]) {
    localStorage[`${app.activeChainId()}-admin-toggle-tree`] = JSON.stringify(
      adminDefaultToggleTree,
    );
  } else if (!verifyCachedToggleTree('admin', adminDefaultToggleTree)) {
    localStorage[`${app.activeChainId()}-admin-toggle-tree`] = JSON.stringify(
      adminDefaultToggleTree,
    );
  }

  const toggleTreeState = JSON.parse(
    localStorage[`${app.activeChainId()}-admin-toggle-tree`],
  );

  const sidebarSectionData: SidebarSectionAttrs = {
    title: 'Admin Capabilities',
    className: 'AdminSection',
    hasDefaultToggle: toggleTreeState['toggledState'],
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      setAdminToggleTree('toggledState', toggle);
    },
    displayData: adminGroupData,
    isActive: true,
    toggleDisabled: false,
  };

  return <SidebarSectionGroup {...sidebarSectionData} />;
};

export { AdminSection };
