import m from 'mithril';
import app from 'state';

import { isRoleOfCommunity } from 'helpers/roles';
import { NotificationCategories } from 'types';
import { OffchainThread, OffchainTag } from 'models';
import TagEditor from 'views/components/tag_editor';
import { MenuItem, PopoverMenu, Icon, Icons } from 'construct-ui';
import { confirmationModalWithText } from '../../modals/confirm_modal';

export const ThreadSubscriptionButton: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const notificationSubscription = app.login.notifications.subscriptions
      .find((v) => v.category === NotificationCategories.NewComment && v.objectId === proposal.uniqueIdentifier);

    return m(MenuItem, {
      onclick: (e) => {
        e.preventDefault();
        if (notificationSubscription) {
          app.login.notifications.deleteSubscription(notificationSubscription).then(() => {
            m.redraw();
          });
        } else {
          app.login.notifications.subscribe(NotificationCategories.NewComment, proposal.uniqueIdentifier).then(() => {
            m.redraw();
          });
        }
      },
      label: notificationSubscription ? 'Turn off notifications' : 'Turn on notifications',
      iconLeft: notificationSubscription ? Icons.VOLUME_X : Icons.VOLUME_2,
    });
  },
};

export const ThreadDeletionButton: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    return m(MenuItem, {
      onclick: async (e) => {
        e.preventDefault();
        const carat = (document.getElementsByClassName('cui-popover-trigger-active')[0] as HTMLButtonElement)
        if (carat) carat.click();
        const confirmed = await confirmationModalWithText('Delete this entire thread?')();
        if (!confirmed) return;
        app.threads.delete(proposal).then(() => {
          m.route.set(`/${app.activeId()}/`);
        });
      },
      label: 'Delete thread',
      iconLeft: Icons.DELETE
    });
  }
};

interface ITagEditorButtonAttrs {
  popoverMenu: boolean,
  openTagEditor: Function
}

export const TagEditorButton: m.Component<ITagEditorButtonAttrs, { isOpen: boolean }> = {
  view: (vnode) => {
    const { openTagEditor } = vnode.attrs;
    return [
      m('.TagEditorButton', [
        vnode.attrs.popoverMenu
          ? m(MenuItem, {
            iconLeft: Icons.TAG,
            fluid: true,
            label: 'Edit Tags',
            onclick: (e) => {
              e.preventDefault();
              openTagEditor();
            },
          })
          : m('a', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              openTagEditor();
            },
          }, [ 'Edit tags' ])
      ]),
    ];
  }
};

interface IThreadCaratMenuAttrs {
  proposal: OffchainThread;
}

const ThreadCaratMenu: m.Component<IThreadCaratMenuAttrs, { isOpen: boolean }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const canEditThread = app.vm.activeAccount
      && (isRoleOfCommunity(app.vm.activeAccount, app.login.addresses, app.login.roles, 'admin', app.activeId())
          || isRoleOfCommunity(app.vm.activeAccount, app.login.addresses, app.login.roles, 'moderator', app.activeId())
          || proposal.author === app.vm.activeAccount.address);
    if (!app.isLoggedIn()) return;

    const openTagEditor = () => {
      vnode.state.isOpen = true;
    };

    return [
      m(PopoverMenu, {
        transitionDuration: 0,
        closeOnOutsideClick: true,
        menuAttrs: { size: 'sm' },
        content: [
          canEditThread && m(TagEditorButton, {
            popoverMenu: true,
            openTagEditor,
          }),
          canEditThread && m(ThreadDeletionButton, { proposal }),
          m(ThreadSubscriptionButton, { proposal }),
        ],
        trigger: m(Icon, {
          name: Icons.CHEVRON_DOWN,
          class: 'discussion-edit-tags',
          style: 'margin-right: 6px;'
        }),
      }),
      vnode.state.isOpen && m(TagEditor, {
        thread: vnode.attrs.proposal,
        onChangeHandler: (tag: OffchainTag) => { proposal.tag = tag; m.redraw(); },
      })
    ];
  },
};

export default ThreadCaratMenu;
