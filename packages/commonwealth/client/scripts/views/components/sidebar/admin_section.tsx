/* @jsx m */

import m from 'mithril';
import app from 'state';
import { handleRedirectClicks } from 'helpers';
import { SectionGroupAttrs, SidebarSectionAttrs } from './types';
import { CreateInviteModal } from '../../modals/create_invite_modal';
import { SidebarSectionGroup } from './sidebar_section';
import { OrderTopicsModal } from '../../modals/order_topics_modal';
import { NewTopicModal } from '../../modals/new_topic_modal';
import { EditTopicThresholdsModal } from '../../modals/edit_topic_thresholds_modal';

function setAdminToggleTree(path: string, toggle: boolean) {
  let currentTree = JSON.parse(
    localStorage[`${app.activeChainId()}-admin-toggle-tree`]
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
  localStorage[`${app.activeChainId()}-admin-toggle-tree`] =
    JSON.stringify(newTree);
}

export class AdminSection implements m.ClassComponent<SidebarSectionAttrs> {
  private createInviteModalActive: boolean;

  view() {
    if (!app.user) return;

    const isAdmin =
      app.user.isSiteAdmin ||
      app.roles.isAdminOfEntity({
        chain: app.activeChainId(),
      });
    const isMod = app.roles.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
    });
    if (!isAdmin && !isMod) return null;

    const toggleTreeState = JSON.parse(
      localStorage[`${app.activeChainId()}-admin-toggle-tree`]
    );
    const adminGroupData: SectionGroupAttrs[] = [
      {
        title: 'Invite members',
        containsChildren: false,
        displayData: null,
        hasDefaultToggle: false,
        isActive: this.createInviteModalActive,
        isVisible: true,
        isUpdated: false,
        onclick: (e) => {
          e.preventDefault();
          const data = { chainInfo: app.chain.meta };
          this.createInviteModalActive = true;
          app.modals.create({
            modal: CreateInviteModal,
            data,
            exitCallback: () => {
              this.createInviteModalActive = false;
            },
          });
        },
      },
      {
        title: 'Manage community',
        containsChildren: false,
        displayData: null,
        hasDefaultToggle: false,
        isActive: m.route.get().includes('/manage'),
        isVisible: true,
        isUpdated: false,
        onclick: (e, toggle: boolean) => {
          e.preventDefault();
          handleRedirectClicks(e, `/manage`, app.activeChainId(), () => {
            setAdminToggleTree(`children.manageCommunity.toggledState`, toggle);
          });
        },
      },
      {
        title: 'Analytics',
        containsChildren: false,
        displayData: null,
        hasDefaultToggle: false,
        isActive: m.route.get().includes('/analytics'),
        isVisible: true,
        isUpdated: false,
        onclick: (e, toggle: boolean) => {
          e.preventDefault();
          handleRedirectClicks(e, `/analytics`, app.activeChainId(), () => {
            setAdminToggleTree(`children.analytics.toggledState`, toggle);
          });
        },
      },
      {
        title: 'New topic',
        isActive: false,
        isVisible: true,
        containsChildren: false,
        displayData: null,
        isUpdated: false,
        hasDefaultToggle: false,
        onclick: (e) => {
          e.preventDefault();
          app.modals.create({ modal: NewTopicModal });
        },
      },
      {
        title: 'Order sidebar topics',
        isActive: false,
        isVisible: true,
        containsChildren: false,
        displayData: null,
        isUpdated: false,
        hasDefaultToggle: false,
        onclick: (e) => {
          e.preventDefault();
          app.modals.create({
            modal: OrderTopicsModal,
          });
        },
      },
      {
        title: 'Edit topic thresholds',
        isActive: false,
        isVisible: true,
        containsChildren: false,
        displayData: null,
        isUpdated: false,
        hasDefaultToggle: false,
        onclick: (e) => {
          e.preventDefault();
          app.modals.create({ modal: EditTopicThresholdsModal });
        },
      },
    ];
    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'Admin Capabilities',
      className: 'AdminSection',
      hasDefaultToggle: toggleTreeState['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setAdminToggleTree('toggledState', toggle);
      },
      displayData: adminGroupData,
      isActive: true,
      toggleDisabled: false,
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}
