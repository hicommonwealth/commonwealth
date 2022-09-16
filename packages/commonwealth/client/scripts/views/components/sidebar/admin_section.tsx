import app from 'state';
import m from 'mithril';
import { SectionGroupAttrs, SidebarSectionAttrs } from './types';
import { CreateInviteModal } from '../../modals/create_invite_modal';
import { navigateToSubpage } from 'client/scripts/app';
import { SidebarSectionGroup } from './sidebar_section';

function setAdminToggleTree(path: string, toggle: boolean) {
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
  implements m.ClassComponent<SidebarSectionAttrs>
{
  private createInviteModalActive: boolean;

  view() {
    const toggleTreeState = JSON.parse(
      localStorage[`${app.activeChainId()}-discussions-toggle-tree`]
    );
    const discussionsGroupData: SectionGroupAttrs[] = [
      {
        title: 'Invite members',
        containsChildren: false,
        displayData: null,
        hasDefaultToggle: false,
        isActive: this.createInviteModalActive,
        isVisible: true,
        isUpdated: false,
        onclick: (e, toggle: boolean) => {
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
          m.route.set(
            `${app.isCustomDomain() ? '' : `/${app.activeChainId()}`}/manage`
          );
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
          navigateToSubpage('/analytics');
        },
      },
    ];
    const sidebarSectionData: SidebarSectionAttrs = {
      title: 'Admin Capabilities',
      hasDefaultToggle: toggleTreeState['toggledState'],
      onclick: (e, toggle: boolean) => {
        e.preventDefault();
        setAdminToggleTree('toggledState', toggle);
      },
      displayData: discussionsGroupData,
      isActive: true,
      toggleDisabled: vnode.attrs.mobile,
    };

    return <SidebarSectionGroup {...sidebarSectionData} />;
  }
}
