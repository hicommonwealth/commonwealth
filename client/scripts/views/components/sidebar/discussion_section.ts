/* eslint-disable @typescript-eslint/ban-types */
import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import { navigateToSubpage } from 'app';
import app from 'state';
import SidebarSection, {
  SectionGroupProps,
  SidebarSectionProps,
} from './sidebar_section';
import { ToggleTree, verifyCachedToggleTree } from '.';

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

export const DiscussionSection: m.Component<{ mobile: boolean }, {}> = {
  view: (vnode) => {
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

    const topics = app.topics
      .getByCommunity(app.activeChainId())
      .map(({ id, name, featuredInSidebar }) => {
        return { id, name, featuredInSidebar };
      })
      .filter((t) => t.featuredInSidebar)
      .sort((a, b) => a.name.localeCompare(b.name));

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

    const discussions_group_data: SectionGroupProps[] = [
      {
        title: 'All',
        contains_children: false,
        default_toggle: false,
        is_visible: true,
        isUpdated: true,
        isActive: onAllDiscussionPage(m.route.get()),
        onclick: (e, toggle: boolean) => {
          e.preventDefault();
          setDiscussionsToggleTree(`children.All.toggledState`, toggle);
          navigateToSubpage('/');
        },
        display_data: null,
      },
      app.activeChainId() === 'near' && {
        title: 'Sputnik Daos',
        contains_children: false,
        default_toggle: false,
        is_visible: true,
        isUpdated: true,
        isActive:
          onSputnikDaosPage(m.route.get()) &&
          (app.chain ? app.chain.serverLoaded : true),
        onclick: (e, toggle: boolean) => {
          e.preventDefault();
          setDiscussionsToggleTree(`children.SputnikDAOs.toggledState`, toggle);
          navigateToSubpage('/sputnik-daos');
        },
        display_data: null,
      },
    ];

    for (const topic of topics) {
      if (topic.featuredInSidebar) {
        const discussionSectionGroup: SectionGroupProps = {
          title: topic.name,
          contains_children: false,
          default_toggle: false,
          is_visible: true,
          isUpdated: true,
          isActive: onFeaturedDiscussionPage(m.route.get(), topic.name),
          onclick: (e, toggle: boolean) => {
            e.preventDefault();
            setDiscussionsToggleTree(
              `children.${topic.name}.toggledState`,
              toggle
            );
            navigateToSubpage(`/discussions/${encodeURI(topic.name)}`);
          },
          display_data: null,
        };
        discussionsGroupData.push(discussionSectionGroup);
      }
    }

    const sidebarSectionData: SidebarSectionProps = {
      title: discussionsLabel,
      default_toggle: toggleTreeState['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setDiscussionsToggleTree('toggledState', toggle);
      },
      displayData: discussionsGroupData,
      isActive: true,
      toggleDisabled: vnode.attrs.mobile,
    };

    return m(SidebarSection, { ...sidebarSectionData });
  },
};
