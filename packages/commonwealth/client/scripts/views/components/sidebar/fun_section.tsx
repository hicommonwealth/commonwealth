/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/sidebar/index.scss';

import app from 'state';
import { handleRedirectClicks } from '../../../helpers';
import { SidebarSectionGroup } from './sidebar_section';
import { SectionGroupAttrs, SidebarSectionAttrs, ToggleTree } from './types';
import { verifyCachedToggleTree } from './helpers';

function setFunToggleTree(path: string, toggle: boolean) {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-fun-toggle-tree`]
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
  localStorage[`${app.activeChainId()}-fun-toggle-tree`] =
    JSON.stringify(newTree);
}

export class FunSection extends ClassComponent<SidebarSectionAttrs> {
  view() {
    const funDefaultToggleTree: ToggleTree = {
      toggledState: false,
      children: {
        CommunityArt: {
          toggledState: false,
          children: {},
        },
      },
    };

    // Check if an existing toggle tree is stored
    if (!localStorage[`${app.activeChainId()}-fun-toggle-tree`]) {
      localStorage[`${app.activeChainId()}-fun-toggle-tree`] =
        JSON.stringify(funDefaultToggleTree);
    } else if (!verifyCachedToggleTree('fun', funDefaultToggleTree)) {
      localStorage[`${app.activeChainId()}-fun-toggle-tree`] =
        JSON.stringify(funDefaultToggleTree);
    }
    const toggleTreeState = JSON.parse(
      localStorage[`${app.activeChainId()}-fun-toggle-tree`]
    );

    const funSectionData: SectionGroupAttrs[] = [
      {
        title: 'Community Art',
        containsChildren: false,
        hasDefaultToggle: false,
        isVisible: true,
        isUpdated: true,
        isActive: false, // TODO: conditional on community
        onclick: (e, toggle: boolean) => {
          e.preventDefault();
          handleRedirectClicks(e, `/community-art`, app.activeChainId(), () => {
            setFunToggleTree(`children.community-art.toggledState`, toggle);
          });
        },
        displayData: null,
      },
    ];

    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'Fun',
      className: 'FunSection',
      hasDefaultToggle: toggleTreeState['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setFunToggleTree('toggledState', toggle);
      },
      displayData: funSectionData,
      isActive: true,
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}
