/* @jsx m */

import m from 'mithril';

import 'components/sidebar/index.scss';

import { navigateToSubpage } from 'app';
import app from 'state';
import { isCommandClick } from '../../../helpers';
import { SidebarSectionGroup } from './sidebar_section';
import {
  MobileSidebarSectionAttrs,
  SectionGroupAttrs,
  SidebarSectionAttrs,
  ToggleTree,
} from './types';
import { verifyCachedToggleTree } from './helpers';

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

export class DiscussionSection
  implements m.ClassComponent<MobileSidebarSectionAttrs>
{
  view(vnode) {
    // Conditional Render Details +
    const onAllDiscussionPage = (p) => {
      const identifier = m.route.param('identifier');
      if (identifier) {
        const thread = app.threads.store.getByIdentifier(
          identifier.slice(0, identifier.indexOf('-'))
        );
        if (thread && !thread.topic) {
          return true;
        }
      }

      return (
        p === `/${app.activeChainId()}/` || p === `/${app.activeChainId()}`
      );
    };
    const onDiscussionsPage = (p) =>
      p === `/${app.activeChainId()}` ||
      p === `/${app.activeChainId()}/` ||
      p.startsWith(`/${app.activeChainId()}/discussions/`) ||
      p.startsWith(`/${app.activeChainId()}/proposal/discussion/`) ||
      p.startsWith(`/${app.activeChainId()}?`);

    const onFeaturedDiscussionPage = (p, topic) => {
      const identifier = m.route.param('identifier');
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
    const onMembersPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/members`) ||
      p.startsWith(`/${app.activeChainId()}/account/`);
    const onSputnikDaosPage = (p) =>
      p.startsWith(`/${app.activeChainId()}/sputnik-daos`);

    const topics = app.topics.store
      .getByCommunity(app.activeChainId())
      .filter((t) => t.featuredInSidebar)
      .sort((a, b) => a.name.localeCompare(b.name))
      .sort((a, b) => a.order - b.order);

    const discussionsLabel = ['vesuvius', 'olympus'].includes(
      app.activeChainId()
    )
      ? 'FORUMS'
      : 'DISCUSSIONS';

    // Build Toggle Tree
    const discussionsDefaultToggleTree: ToggleTree = {
      toggledState: true,
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
      console.log("setting discussions toggle tree since it doesn't exist");
      localStorage[`${app.activeChainId()}-discussions-toggle-tree`] =
        JSON.stringify(discussionsDefaultToggleTree);
    } else if (
      !verifyCachedToggleTree('discussions', discussionsDefaultToggleTree)
    ) {
      console.log(
        'setting discussions toggle tree since the cached version differs from the updated version'
      );
      localStorage[`${app.activeChainId()}-discussions-toggle-tree`] =
        JSON.stringify(discussionsDefaultToggleTree);
    }
    let toggleTreeState = JSON.parse(
      localStorage[`${app.activeChainId()}-discussions-toggle-tree`]
    );
    if (vnode.attrs.mobile) {
      toggleTreeState = discussionsDefaultToggleTree;
    }

    const discussionsGroupData: SectionGroupAttrs[] = [
      {
        title: 'All',
        containsChildren: false,
        hasDefaultToggle: false,
        isVisible: true,
        isUpdated: true,
        isActive: onAllDiscussionPage(m.route.get()),
        onclick: (e, toggle: boolean) => {
          e.preventDefault();
          setDiscussionsToggleTree(`children.All.toggledState`, toggle);
          navigateToSubpage('/');
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
          onSputnikDaosPage(m.route.get()) &&
          (app.chain ? app.chain.serverLoaded : true),
        onclick: (e, toggle: boolean) => {
          e.preventDefault();
          setDiscussionsToggleTree(`children.SputnikDAOs.toggledState`, toggle);
          navigateToSubpage('/sputnik-daos');
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
          isActive: onFeaturedDiscussionPage(m.route.get(), topic.name),
          // eslint-disable-next-line no-loop-func
          onclick: (e, toggle: boolean) => {
            if (isCommandClick(e)) {
              e.preventDefault();
              window.open(
                `/${app.activeChainId()}/discussions/${encodeURI(topic.name)}`,
                ' _blank'
              );
              return;
            }
            e.preventDefault();
            setDiscussionsToggleTree(
              `children.${topic.name}.toggledState`,
              toggle
            );

            navigateToSubpage(`/discussions/${encodeURI(topic.name)}`);
          },
          displayData: null,
        };
        discussionsGroupData.push(discussionSectionGroup);
      }
    }

    const sidebarSectionData: SidebarSectionAttrs = {
      title: discussionsLabel,
      hasDefaultToggle: toggleTreeState['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setDiscussionsToggleTree('toggledState', toggle);
      },
      displayData: discussionsGroupData,
      isActive: true,
      toggleDisabled: vnode.attrs.mobile,
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}
