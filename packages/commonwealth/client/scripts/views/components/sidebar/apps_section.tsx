/* @jsx m */

import m from 'mithril';
import app from 'state';
import { handleRedirectClicks } from 'helpers';
import { SectionGroupAttrs, SidebarSectionAttrs, ToggleTree } from './types';
import { SidebarSectionGroup } from './sidebar_section';
import { OrderTopicsModal } from '../../modals/order_topics_modal';
import { NewTopicModal } from '../../modals/new_topic_modal';
import { EditTopicThresholdsModal } from '../../modals/edit_topic_thresholds_modal';
import { verifyCachedToggleTree } from './helpers';

export class AppsSection implements m.ClassComponent<SidebarSectionAttrs> {

  view() {
    if (!app.user) return;

    const appsGroupData: SectionGroupAttrs[] = [
      {
        title: 'Compound App',
        containsChildren: false,
        displayData: null,
        hasDefaultToggle: false,
        isActive: m.route.get().includes('/manage'),
        isVisible: true,
        isUpdated: false,
        onclick: (e, toggle: boolean) => {
          e.preventDefault();
          console.log( 'clicked' );
          handleRedirectClicks(e, `/apps/app.compound.finance`, app.activeChainId(), () => {
            setAppsToggleTree(`children.app.toggledState`, toggle);
          });
        },
      },
    ];

    // Build Toggle Tree
    const appsDefaultToggleTree: ToggleTree = {
      toggledState: false,
      children: {},
    };

    // Check if an existing toggle tree is stored
    if (!localStorage[`${app.activeChainId()}-apps-toggle-tree`]) {
      localStorage[`${app.activeChainId()}-apps-toggle-tree`] = JSON.stringify(
        appsDefaultToggleTree
      );
    } else if (!verifyCachedToggleTree('apps', appsDefaultToggleTree)) {
      localStorage[`${app.activeChainId()}-apps-toggle-tree`] = JSON.stringify(
        appsDefaultToggleTree
      );
    }
    const toggleTreeState = JSON.parse(
      localStorage[`${app.activeChainId()}-apps-toggle-tree`]
    );

    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'Apps',
      className: 'AppsSection',
      hasDefaultToggle: toggleTreeState['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setAppsToggleTree('toggledState', toggle);
      },
      displayData: appsGroupData,
      isActive: true,
      toggleDisabled: false,
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}

function setAppsToggleTree(path: string, toggle: boolean) {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-apps-toggle-tree`]
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
  localStorage[`${app.activeChainId()}-apps-toggle-tree`] =
    JSON.stringify(newTree);
}

