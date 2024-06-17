import React from 'react';

import { handleRedirectClicks } from 'helpers';
import { useCommonNavigate } from 'navigation/helpers';
import { matchRoutes, useLocation } from 'react-router-dom';
import app from 'state';
import { useFlag } from '../../../../hooks/useFlag';
import { SidebarSectionGroup } from '../sidebar_section';
import type { SectionGroupAttrs, SidebarSectionAttrs } from '../types';
import { useSidebarTreeToggle } from '../useSidebarTreeToggle';

const AdminSection = () => {
  const proposalTemplatesEnabled = useFlag('proposalTemplates');
  const contestsEnabled = useFlag('contest');

  const navigate = useCommonNavigate();
  const location = useLocation();
  const { resetSidebarState, setToggleTree, toggledTreeState } =
    useSidebarTreeToggle({
      treeName: 'admin',
      localStorageKey: `${app.activeChainId()}-admin-toggle-tree`,
    });

  const matchesCommunityProfileRoute = matchRoutes(
    [{ path: '/manage/profile' }, { path: ':scope/manage/profile' }],
    location,
  );
  const matchesCommunityIntegrationsRoute = matchRoutes(
    [{ path: '/manage/integrations' }, { path: ':scope/manage/integrations' }],
    location,
  );
  const matchesCommunityTopicsRoute = matchRoutes(
    [{ path: '/manage/topics' }, { path: ':scope/manage/topics' }],
    location,
  );
  const matchesCommunityModeratorsRoute = matchRoutes(
    [{ path: '/manage/moderators' }, { path: ':scope/manage/moderators' }],
    location,
  );
  const matchesContestsRoute = matchRoutes(
    [{ path: '/manage/contests/*' }, { path: ':scope/manage/contests/*' }],
    location,
  );
  const matchesMembersAndGroupsRoute = matchRoutes(
    [{ path: '/members' }, { path: ':scope/members' }],
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
          `/manage/profile`,
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
          `/manage/integrations`,
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
          `/manage/topics`,
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
          `/manage/moderators`,
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
      isActive: !!matchesMembersAndGroupsRoute,
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
    ...(contestsEnabled
      ? [
          {
            title: 'Contests',
            containsChildren: false,
            displayData: null,
            hasDefaultToggle: false,
            isActive: !!matchesContestsRoute,
            isVisible: true,
            isUpdated: false,
            onClick: (e, toggle: boolean) => {
              e.preventDefault();
              resetSidebarState();
              handleRedirectClicks(
                navigate,
                e,
                `/manage/contests`,
                app.activeChainId(),
                () => {
                  setToggleTree(`children.contests.toggledState`, toggle);
                },
              );
            },
          },
        ]
      : []),
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
    ...(proposalTemplatesEnabled
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
