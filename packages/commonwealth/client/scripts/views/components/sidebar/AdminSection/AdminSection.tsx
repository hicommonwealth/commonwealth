import React from 'react';

import { handleRedirectClicks } from 'helpers';
import { featureFlags } from 'helpers/feature-flags';
import { useCommonNavigate } from 'navigation/helpers';
import { matchRoutes, useLocation } from 'react-router-dom';
import app from 'state';
import { SidebarSectionGroup } from '../sidebar_section';
import type { SectionGroupAttrs, SidebarSectionAttrs } from '../types';
import { useSidebarTreeToggle } from '../useSidebarTreeToggle';

const AdminSection = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();
  const { resetSidebarState, setToggleTree, toggledTreeState } =
    useSidebarTreeToggle({
      treeName: 'admin',
      localStorageKey: `${app.activeChainId()}-admin-toggle-tree`,
    });

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
            setToggleTree(`children.communityProfile.toggledState`, toggle);
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
            setToggleTree(`children.integrations.toggledState`, toggle);
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
            setToggleTree(`children.topics.toggledState`, toggle);
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
            setToggleTree(`children.adminsAndModerators.toggledState`, toggle);
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
            setToggleTree(`children.membersAndGroups.toggledState`, toggle);
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
            setToggleTree(`children.analytics.toggledState`, toggle);
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
                  setToggleTree(`children.contracts.toggledState`, toggle);
                },
              );
            },
          },
        ]
      : []),
  ];

  const sidebarSectionData: SidebarSectionAttrs = {
    title: 'Admin Capabilities',
    className: 'AdminSection',
    hasDefaultToggle: toggledTreeState['toggledState'],
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      setToggleTree('toggledState', toggle);
    },
    displayData: adminGroupData,
    isActive: true,
    toggleDisabled: false,
  };

  return <SidebarSectionGroup {...sidebarSectionData} />;
};

export { AdminSection };
