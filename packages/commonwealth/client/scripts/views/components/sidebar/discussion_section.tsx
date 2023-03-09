import React from 'react';

import {
  _DEPRECATED_getRoute,
  _DEPRECATED_getSearchParams,
} from 'mithrilInterop';

import 'components/sidebar/index.scss';
import app from 'state';
import { handleRedirectClicks } from '../../../helpers';
import { verifyCachedToggleTree } from './helpers';
import { SidebarSectionGroup } from './sidebar_section';
import type {
  SectionGroupAttrs,
  SidebarSectionAttrs,
  ToggleTree,
} from './types';
import { useCommonNavigate } from 'navigation/helpers';

function setDiscussionsToggleTree(path: string, toggle: boolean) {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-discussions-toggle-tree`]
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
  localStorage[`${app.activeChainId()}-discussions-toggle-tree`] =
    JSON.stringify(newTree);
}

export const DiscussionSection = () => {
  const navigate = useCommonNavigate();

  // Conditional Render Details +
  const onAllDiscussionPage = (p) => {
    const identifier = _DEPRECATED_getSearchParams('§');
    if (identifier) {
      const thread = app.threads.store.getByIdentifier(
        identifier.slice(0, identifier.indexOf('-'))
      );
      if (thread && !thread.topic) {
        return true;
      }
    }

    return (
      p === `/${app.activeChainId()}/discussions` ||
      p === `/${app.activeChainId()}/discussions/`
    );
  };

  const onOverviewDiscussionPage = (p) => {
    const identifier = _DEPRECATED_getSearchParams('identifier');
    if (identifier) {
      const thread = app.threads.store.getByIdentifier(
        identifier.slice(0, identifier.indexOf('-'))
      );
      if (thread && !thread.topic) {
        return true;
      }
    }

    return p === `/${app.activeChainId()}/overview`;
  };

  const onFeaturedDiscussionPage = (p, topic) => {
    const identifier = _DEPRECATED_getSearchParams('identifier');
    if (identifier) {
      const thread = app.threads.store.getByIdentifier(
        identifier.slice(0, identifier.indexOf('-'))
      );
      if (thread?.topic && thread.topic.name === topic) {
        return true;
      }
    }
    return decodeURI(p).endsWith(`/discussions/${topic}`);
  };

  const onSputnikDaosPage = (p) =>
    p.startsWith(`/${app.activeChainId()}/sputnik-daos`);

  const topics = app.topics.store
    .getByCommunity(app.activeChainId())
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
    localStorage[`${app.activeChainId()}-discussions-toggle-tree`]
  );

  const discussionsGroupData: SectionGroupAttrs[] = [
    {
      title: 'All',
      containsChildren: false,
      hasDefaultToggle: false,
      isVisible: true,
      isUpdated: true,
      isActive: onAllDiscussionPage(_DEPRECATED_getRoute()),
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        handleRedirectClicks(
          navigate,
          e,
          `/discussions`,
          app.activeChainId(),
          () => {
            setDiscussionsToggleTree(`children.All.toggledState`, toggle);
          }
        );
      },
      displayData: null,
    },
    {
      title: 'Overview',
      containsChildren: false,
      hasDefaultToggle: false,
      isVisible: true,
      isUpdated: true,
      isActive: onOverviewDiscussionPage(_DEPRECATED_getRoute()),
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        handleRedirectClicks(
          navigate,
          e,
          `/overview`,
          app.activeChainId(),
          () => {
            setDiscussionsToggleTree(`children.Overview.toggledState`, toggle);
          }
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
        onSputnikDaosPage(_DEPRECATED_getRoute()) &&
        (app.chain ? app.chain.serverLoaded : true),
      onClick: (e, toggle: boolean) => {
        e.preventDefault();
        handleRedirectClicks(
          navigate,
          e,
          `/sputnik-daos`,
          app.activeChainId(),
          () => {
            setDiscussionsToggleTree(
              `children.SputnikDAOs.toggledState`,
              toggle
            );
          }
        );
      },
      displayData: null,
    },
  ];

  for (const topic of topics) {
    if (topic.featuredInSidebar) {
      const discussionSectionGroup: SectionGroupAttrs = {
        title: topic.name,
        containsChildren: false,
        hasDefaultToggle: false,
        isVisible: true,
        isUpdated: true,
        isActive: onFeaturedDiscussionPage(_DEPRECATED_getRoute(), topic.name),
        // eslint-disable-next-line no-loop-func
        onClick: (e, toggle: boolean) => {
          e.preventDefault();
          handleRedirectClicks(
            navigate,
            e,
            `/discussions/${encodeURI(topic.name)}`,
            app.activeChainId(),
            () => {
              setDiscussionsToggleTree(
                `children.${topic.name}.toggledState`,
                toggle
              );
            }
          );
        },
        displayData: null,
      };
      discussionsGroupData.push(discussionSectionGroup);
    }
  }

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
