/* eslint-disable @typescript-eslint/ban-types */
import 'components/sidebar/index.scss';

import m from 'mithril';
import { navigateToSubpage } from 'app';
import app from 'state';
import {
  SidebarSection,
  SectionGroupProps,
  SidebarSectionProps,
} from './sidebar_section';
import { ToggleTree, verifyCachedToggleTree } from '.';

function setDiscussionsToggleTree(path: string, toggle: boolean) {
  let current_tree = JSON.parse(
    localStorage[`${app.activeChainId()}-discussions-toggle-tree`]
  );
  const split = path.split('.');
  for (const field of split.slice(0, split.length - 1)) {
    if (current_tree.hasOwnProperty(field)) {
      current_tree = current_tree[field];
    } else {
      return;
    }
  }
  current_tree[split[split.length - 1]] = toggle;
  const new_tree = current_tree;
  localStorage[`${app.activeChainId()}-discussions-toggle-tree`] =
    JSON.stringify(new_tree);
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
    const discussions_default_toggle_tree: ToggleTree = {
      toggled_state: true,
      children: {},
    };

    for (const topic of topics) {
      if (topic.featuredInSidebar) {
        discussions_default_toggle_tree.children[topic.name] = {
          toggled_state: true,
          children: {
            All: {
              toggled_state: false,
            },
            ...(app.activeChainId() === 'near' && {
              SputnikDaos: {
                toggled_state: false,
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
        JSON.stringify(discussions_default_toggle_tree);
    } else if (
      !verifyCachedToggleTree('discussions', discussions_default_toggle_tree)
    ) {
      console.log(
        'setting discussions toggle tree since the cached version differs from the updated version'
      );
      localStorage[`${app.activeChainId()}-discussions-toggle-tree`] =
        JSON.stringify(discussions_default_toggle_tree);
    }
    let toggle_tree_state = JSON.parse(
      localStorage[`${app.activeChainId()}-discussions-toggle-tree`]
    );
    if (vnode.attrs.mobile) {
      toggle_tree_state = discussions_default_toggle_tree;
    }

    const discussions_group_data: SectionGroupProps[] = [
      {
        title: 'All',
        containsChildren: false,
        hasDefaultToggle: false,
        isVisible: true,
        isUpdated: true,
        isActive: onAllDiscussionPage(m.route.get()),
        onclick: (e, toggle: boolean) => {
          e.preventDefault();
          setDiscussionsToggleTree(`children.All.toggled_state`, toggle);
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
          setDiscussionsToggleTree(
            `children.SputnikDAOs.toggled_state`,
            toggle
          );
          navigateToSubpage('/sputnik-daos');
        },
        displayData: null,
      },
    ];

    for (const topic of topics) {
      if (topic.featuredInSidebar) {
        const discussion_section_group: SectionGroupProps = {
          title: topic.name,
          containsChildren: false,
          hasDefaultToggle: false,
          isVisible: true,
          isUpdated: true,
          isActive: onFeaturedDiscussionPage(m.route.get(), topic.name),
          onclick: (e, toggle: boolean) => {
            e.preventDefault();
            setDiscussionsToggleTree(
              `children.${topic.name}.toggled_state`,
              toggle
            );
            navigateToSubpage(`/discussions/${encodeURI(topic.name)}`);
          },
          displayData: null,
        };
        discussions_group_data.push(discussion_section_group);
      }
    }

    const sidebar_section_data: SidebarSectionProps = {
      title: discussionsLabel,
      hasDefaultToggle: toggle_tree_state['toggled_state'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setDiscussionsToggleTree('toggled_state', toggle);
      },
      displayData: discussions_group_data,
      isActive: true,
      toggleDisabled: vnode.attrs.mobile,
    };

    return m(SidebarSection, { ...sidebar_section_data });
  },
};
