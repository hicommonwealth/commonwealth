import React from 'react';

import 'components/sidebar/index.scss';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import { matchRoutes, useLocation } from 'react-router-dom';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import { sidebarStore } from 'state/ui/sidebar';
import { handleRedirectClicks } from '../../../helpers';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
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

function setDiscussionsToggleTree(path: string, toggle: boolean) {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-discussions-toggle-tree`],
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
  localStorage[`${app.activeChainId()}-discussions-toggle-tree`] =
    JSON.stringify(newTree);
}

export const DiscussionSection = ({
  isContestAvailable,
}: {
  isContestAvailable: boolean;
}) => {
  const navigate = useCommonNavigate();
  const location = useLocation();

  const contestsEnabled = useFlag('contest');

  const matchesDiscussionsRoute = matchRoutes(
    [{ path: '/discussions' }, { path: ':scope/discussions' }],
    location,
  );
  const matchesOverviewRoute = matchRoutes(
    [{ path: '/overview' }, { path: ':scope/overview' }],
    location,
  );
  const matchesContestsRoute = matchRoutes(
    [{ path: '/contests' }, { path: ':scope/contests' }],
    location,
  );
  const matchesArchivedRoute = matchRoutes(
    [{ path: '/archived' }, { path: ':scope/archived' }],
    location,
  );
  const matchesDiscussionsTopicRoute = matchRoutes(
    [{ path: '/discussions/:topic' }, { path: ':scope/discussions/:topic' }],
    location,
  );
  const matchesSputnikDaosRoute = matchRoutes(
    [{ path: '/sputnik-daos' }, { path: ':scope/sputnik-daos' }],
    location,
  );

  const { data: topicsData } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const topics = (topicsData || [])
    .filter((t) => t.featuredInSidebar)
    .sort((a, b) => a.name.localeCompare(b.name))
    .sort((a, b) => a.order - b.order);

  const discussionsLabel = ['vesuvius', 'olympus'].includes(app.activeChainId())
    ? 'Forum'
    : 'Discussion';

  // Build Toggle Tree
  const discussionsDefaultToggleTree: ToggleTree = {
    toggledState: false,
    children: {},
  };

  for (const topic of topics) {
    if (topic.featuredInSidebar) {
      discussionsDefaultToggleTree.children[topic.name] = {
        toggledState: true,
        children: {
          All: {
            toggledState: false,
          },
          ...(app.activeChainId() === 'near' && {
            SputnikDaos: {
              toggledState: false,
            },
          }),
        },
      };
    }
  }

  // Check if an existing toggle tree is stored
  if (!localStorage[`${app.activeChainId()}-discussions-toggle-tree`]) {
    localStorage[`${app.activeChainId()}-discussions-toggle-tree`] =
      JSON.stringify(discussionsDefaultToggleTree);
  } else if (
    !verifyCachedToggleTree('discussions', discussionsDefaultToggleTree)
  ) {
    localStorage[`${app.activeChainId()}-discussions-toggle-tree`] =
      JSON.stringify(discussionsDefaultToggleTree);
  }
  const toggleTreeState = JSON.parse(
    localStorage[`${app.activeChainId()}-discussions-toggle-tree`],
  );

  const discussionsGroupData: SectionGroupAttrs[] = [
    {
      title: 'All',
      containsChildren: false,
      hasDefaultToggle: false,
      isVisible: true,
      isUpdated: true,
      isActive: !!matchesDiscussionsRoute,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/discussions`,
          app.activeChainId(),
          () => {
            setDiscussionsToggleTree(`children.All.toggledState`, toggle);
          },
        );
      },
      displayData: null,
    },
    ...(contestsEnabled && isContestAvailable
      ? [
          {
            title: 'Contests',
            containsChildren: false,
            displayData: null,
            hasDefaultToggle: false,
            isActive: !!matchesContestsRoute,
            isVisible: true,
            isUpdated: true,
            onClick: (e, toggle: boolean) => {
              e.preventDefault();
              resetSidebarState();
              handleRedirectClicks(
                navigate,
                e,
                `/contests`,
                app.activeChainId(),
                () => {
                  setDiscussionsToggleTree(
                    `children.Contests.toggledState`,
                    toggle,
                  );
                },
              );
            },
          },
        ]
      : []),
    {
      title: 'Overview',
      containsChildren: false,
      hasDefaultToggle: false,
      isVisible: true,
      isUpdated: true,
      isActive: !!matchesOverviewRoute,
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/overview`,
          app.activeChainId(),
          () => {
            setDiscussionsToggleTree(`children.Overview.toggledState`, toggle);
          },
        );
      },
      displayData: null,
    },
    app.activeChainId() === 'near' && {
      title: 'Sputnik Daos',
      containsChildren: false,
      hasDefaultToggle: false,
      isVisible: true,
      isUpdated: true,
      isActive:
        !!matchesSputnikDaosRoute &&
        (app.chain ? app.chain.serverLoaded : true),
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        resetSidebarState();
        handleRedirectClicks(
          navigate,
          e,
          `/sputnik-daos`,
          app.activeChainId(),
          () => {
            setDiscussionsToggleTree(
              `children.SputnikDAOs.toggledState`,
              toggle,
            );
          },
        );
      },
      displayData: null,
    },
  ];

  for (const topic of topics) {
    if (topic.featuredInSidebar) {
      const topicInvolvedInActiveContest = true;

      const discussionSectionGroup: SectionGroupAttrs = {
        title: topic.name,
        containsChildren: false,
        hasDefaultToggle: false,
        isVisible: true,
        isUpdated: true,
        isActive:
          matchesDiscussionsTopicRoute?.[0]?.params?.topic === topic.name,
        // eslint-disable-next-line no-loop-func
        onClick: (e, toggle: boolean) => {
          e.preventDefault();
          resetSidebarState();
          handleRedirectClicks(
            navigate,
            e,
            `/discussions/${encodeURI(topic.name)}`,
            app.activeChainId(),
            () => {
              setDiscussionsToggleTree(
                `children.${topic.name}.toggledState`,
                toggle,
              );
            },
          );
        },
        displayData: null,
        ...(topicInvolvedInActiveContest
          ? { rightIcon: <CWIcon iconName="trophy" iconSize="small" /> }
          : {}),
      };
      discussionsGroupData.push(discussionSectionGroup);
    }
  }

  const archivedSectionGroup: SectionGroupAttrs = {
    title: 'Archived',
    rightIcon: <CWIcon iconName="archiveTray" iconSize="small" />,
    containsChildren: false,
    hasDefaultToggle: false,
    isVisible: true,
    isUpdated: true,
    isActive: !!matchesArchivedRoute,
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      handleRedirectClicks(
        navigate,
        e,
        `/archived`,
        app.activeChainId(),
        () => {
          setDiscussionsToggleTree(`children.Archived.toggledState`, toggle);
        },
      );
    },
    displayData: null,
  };

  discussionsGroupData.push(archivedSectionGroup);

  const sidebarSectionData: SidebarSectionAttrs = {
    title: discussionsLabel,
    className: 'DiscussionSection',
    hasDefaultToggle: toggleTreeState['toggledState'],
    onClick: (e, toggle: boolean) => {
      e.preventDefault();
      setDiscussionsToggleTree('toggledState', toggle);
    },
    displayData: discussionsGroupData,
    isActive: true,
  };

  return <SidebarSectionGroup {...sidebarSectionData} />;
};
