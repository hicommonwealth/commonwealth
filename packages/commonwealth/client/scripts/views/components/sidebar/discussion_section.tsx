import React from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';

import { useCommonNavigate } from 'navigation/helpers';
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

import './index.scss';

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
interface DiscussionSectionProps {
  topicIdsIncludedInContest: number[];
}
export const DiscussionSection = ({
  topicIdsIncludedInContest,
}: DiscussionSectionProps) => {
  const navigate = useCommonNavigate();
  const location = useLocation();
  const matchesDiscussionsRoute = matchRoutes(
    [{ path: '/discussions' }, { path: ':scope/discussions' }],
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

  const communityId = app.activeChainId() || '';
  const { data: topicsData } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const topics = (topicsData || [])
    .filter((t) => t.featured_in_sidebar)
    .sort((a, b) => a.name.localeCompare(b.name))
    // @ts-expect-error <StrictNullChecks/>
    .sort((a, b) => a.order - b.order);

  const discussionsLabel = ['vesuvius', 'olympus'].includes(communityId)
    ? 'Forum'
    : 'Discussion';

  // Build Toggle Tree
  const discussionsDefaultToggleTree: ToggleTree = {
    toggledState: false,
    children: {},
  };

  for (const topic of topics) {
    if (topic.featured_in_sidebar) {
      discussionsDefaultToggleTree.children[topic.name] = {
        toggledState: true,
        children: {
          All: {
            toggledState: false,
          },
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
        handleRedirectClicks(navigate, e, `/discussions`, communityId, () => {
          setDiscussionsToggleTree(`children.All.toggledState`, toggle);
        });
      },
      displayData: null,
      rightIcon: <CWIcon iconName="squaresFour" iconSize="small" />,
    },
  ];

  for (const topic of topics) {
    if (topic.featured_in_sidebar) {
      const topicInvolvedInActiveContest =
        topic?.id && topicIdsIncludedInContest.includes(topic.id);

      let rightIcon;
      if (topicInvolvedInActiveContest) {
        rightIcon = <CWIcon iconName="trophy" iconSize="small" />;
      } else if (topic.weighted_voting) {
        rightIcon = <CWIcon iconName="lockedNew" iconSize="small" />;
      } else {
        rightIcon = <CWIcon iconName="hash" iconSize="small" />;
      }

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
            communityId,
            () => {
              setDiscussionsToggleTree(
                `children.${topic.name}.toggledState`,
                toggle,
              );
            },
          );
        },
        displayData: null,
        rightIcon,
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
      handleRedirectClicks(navigate, e, `/archived`, communityId, () => {
        setDiscussionsToggleTree(`children.Archived.toggledState`, toggle);
      });
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
