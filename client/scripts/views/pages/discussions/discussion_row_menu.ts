import 'pages/discussions/discussion_row_menu.scss';

import m from 'mithril';
import app from 'state';

import { NotificationCategories } from 'types';
import { OffchainThread, OffchainTag } from 'models';
import TagEditor from 'views/components/tag_editor';
import { MenuItem, PopoverMenu, Icon, Icons } from 'construct-ui';
import { confirmationModalWithText } from '../../modals/confirm_modal';

export const ThreadSubscriptionButton: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const notificationSubscription = app.user.notifications.subscriptions
      .find((v) => v.category === NotificationCategories.NewComment && v.objectId === proposal.uniqueIdentifier);

    return m(MenuItem, {
      onclick: (e) => {
        e.preventDefault();
        if (notificationSubscription && notificationSubscription.isActive) {
          app.user.notifications.disableSubscriptions([notificationSubscription]).then(() => {
            m.redraw();
          });
        } else if (notificationSubscription) { // subscription, but not active
          app.user.notifications.enableSubscriptions([notificationSubscription]).then(() => {
            m.redraw();
          });
        } else {
          app.user.notifications.subscribe(NotificationCategories.NewComment, proposal.uniqueIdentifier).then(() => {
            m.redraw();
          });
        }
      },
      label: notificationSubscription?.isActive ? 'Turn off notifications' : 'Turn on notifications',
    });
  },
};

export const ThreadDeletionButton: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    return m(MenuItem, {
      onclick: async (e) => {
        e.preventDefault();
        const carat = (document.getElementsByClassName('cui-popover-trigger-active')[0] as HTMLButtonElement);
        if (carat) carat.click();
        const confirmed = await confirmationModalWithText('Delete this entire thread?')();
        if (!confirmed) return;
        app.threads.delete(proposal).then(() => {
          m.route.set(`/${app.activeId()}/`);
        });
      },
      label: 'Delete',
    });
  }
};

export const TagEditorButton: m.Component<{ openTagEditor: Function }, { isOpen: boolean }> = {
  view: (vnode) => {
    const { openTagEditor } = vnode.attrs;
    return m('.TagEditorButton', [
      m(MenuItem, {
        fluid: true,
        label: 'Edit tags',
        onclick: (e) => {
          e.preventDefault();
          openTagEditor();
        },
      })
    ]);
  }
};

const DiscussionRowMenu: m.Component<{ proposal: OffchainThread }, { tagEditorIsOpen: boolean }> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return;
    const { proposal } = vnode.attrs;

    const canEditThread = app.user.activeAccount
      && (app.user.isRoleOfCommunity({
        role: 'admin',
        chain: app.activeChainId(),
        community: app.activeCommunityId()
      })
      || app.user.isRoleOfCommunity({
        role: 'moderator',
        chain: app.activeChainId(),
        community: app.activeCommunityId()
      })
      || proposal.author === app.user.activeAccount.address);

    return m('.DiscussionRowMenu', {
      onclick: (e) => {
        // prevent clicks from propagating to discussion row
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
      m(PopoverMenu, {
        transitionDuration: 0,
        closeOnOutsideClick: true,
        closeOnContentClick: true,
        menuAttrs: {},
        content: [
          canEditThread && m(TagEditorButton, { openTagEditor: () => { vnode.state.tagEditorIsOpen = true; } }),
          canEditThread && m(ThreadDeletionButton, { proposal }),
          m(ThreadSubscriptionButton, { proposal }),
        ],
        inline: true,
        trigger: m(Icon, {
          name: Icons.CHEVRON_DOWN,
        }),
      }),
      vnode.state.tagEditorIsOpen && m(TagEditor, {
        thread: vnode.attrs.proposal,
        popoverMenu: true,
        onChangeHandler: (tag: OffchainTag) => { proposal.tag = tag; m.redraw(); },
        openStateHandler: (v) => { vnode.state.tagEditorIsOpen = v; m.redraw(); },
      })
    ]);
  },
};

export default DiscussionRowMenu;
