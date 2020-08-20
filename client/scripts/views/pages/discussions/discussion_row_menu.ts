import 'pages/discussions/discussion_row_menu.scss';

import m from 'mithril';
import app from 'state';

import { NotificationCategories } from 'types';
import { OffchainThread, OffchainTopic } from 'models';
import TopicEditor from 'views/components/topic_editor';
import { MenuItem, PopoverMenu, Icon, Icons, MenuDivider } from 'construct-ui';
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

export const TopicEditorButton: m.Component<{ openTopicEditor: Function }, { isOpen: boolean }> = {
  view: (vnode) => {
    const { openTopicEditor } = vnode.attrs;
    return m('.TopicEditorButton', [
      m(MenuItem, {
        fluid: true,
        label: 'Move to another topic',
        onclick: (e) => {
          e.preventDefault();
          openTopicEditor();
        },
      })
    ]);
  }
};

const DiscussionRowMenu: m.Component<{ proposal: OffchainThread }, { topicEditorIsOpen: boolean }> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return;
    const { proposal } = vnode.attrs;

    const hasAdminPermissions = app.user.activeAccount
    && (app.user.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    })
    || app.user.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    }));

    const isAuthor = app.user.activeAccount
      && (proposal.author === app.user.activeAccount.address);

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
          hasAdminPermissions && m(MenuItem, {
            class: 'pin-thread-toggle',
            onclick: (e) => {
              e.preventDefault();
              app.threads.pin({ proposal }).then(() => m.redraw());
            },
            label: proposal.pinned ? 'Unpin thread' : 'Pin thread',
          }),
          hasAdminPermissions && m(MenuItem, {
            class: 'read-only-toggle',
            onclick: (e) => {
              e.preventDefault();
              app.threads.setPrivacy({
                threadId: proposal.id,
                privacy: null,
                readOnly: !proposal.readOnly,
              }).then(() => m.redraw());
            },
            label: proposal.readOnly ? 'Unlock thread' : 'Lock thread',
          }),
          hasAdminPermissions && m(TopicEditorButton, {
            openTopicEditor: () => { vnode.state.topicEditorIsOpen = true; }
          }),
          (isAuthor || hasAdminPermissions) && m(ThreadDeletionButton, { proposal }),
          (isAuthor || hasAdminPermissions) && m(MenuDivider),
          m(ThreadSubscriptionButton, { proposal }),
        ],
        inline: true,
        trigger: m(Icon, {
          name: Icons.CHEVRON_DOWN,
        }),
      }),
      vnode.state.topicEditorIsOpen && m(TopicEditor, {
        thread: vnode.attrs.proposal,
        popoverMenu: true,
        onChangeHandler: (topic: OffchainTopic) => { proposal.topic = topic; m.redraw(); },
        openStateHandler: (v) => { vnode.state.topicEditorIsOpen = v; m.redraw(); },
      })
    ]);
  },
};

export default DiscussionRowMenu;
