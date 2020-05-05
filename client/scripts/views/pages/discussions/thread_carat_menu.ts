import { default as m } from 'mithril';
import app from 'state';

import { isRoleOfCommunity } from 'helpers/roles';
import { NotificationCategories } from 'types';
import { OffchainThread, OffchainTag } from 'models';
import TagEditor from '../../components/tag_editor';
import { MenuItem, PopoverMenu, Icon, Icons } from 'construct-ui';




export const ThreadSubscriptionButton: m.Component<{proposal: OffchainThread,}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const subscriptions = app.login.notifications;
    const communitySubscription = subscriptions.subscriptions
      .find((v) => v.category === NotificationCategories.NewComment && v.objectId === proposal.uniqueIdentifier );

    return m(MenuItem, {
        onclick: (e) => {
          e.preventDefault();
          if (communitySubscription) {
            subscriptions.deleteSubscription(communitySubscription).then(() => {
              m.redraw();
            });
          } else {
            subscriptions.subscribe(NotificationCategories.NewComment, proposal.uniqueIdentifier).then(() => {
              m.redraw();
            });
          }
        },
        label: communitySubscription ? 'Turn off notifications' : 'Turn on notifications',
        iconLeft: communitySubscription ? Icons.VOLUME_X : Icons.VOLUME_2,
      });
  },
};

interface IThreadCaratMenuAttrs {
  proposal: OffchainThread;
}

const ThreadCaratMenu: m.Component<IThreadCaratMenuAttrs> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const canEditTags = app.vm.activeAccount
      && (isRoleOfCommunity(app.vm.activeAccount, app.login.addresses, app.login.roles, 'admin', app.activeId())
          || isRoleOfCommunity(app.vm.activeAccount, app.login.addresses, app.login.roles, 'moderator', app.activeId())
          || proposal.author === app.vm.activeAccount.address);

    return m(PopoverMenu, {
      transitionDuration: 0,
      closeOnOutsideClick: true,
      menuAttrs: { size: 'default', },
      content: [
        canEditTags
          && m(TagEditor, {
          thread: proposal,
          popoverMenu: true,
          onChangeHandler: (tags: OffchainTag[]) => { proposal.tags = tags; m.redraw(); },}),
        m(ThreadSubscriptionButton, { proposal }),
        ],
      trigger: m(Icon, {
        name: Icons.CHEVRON_DOWN,
        class: 'discussion-edit-tags',
        style: 'margin-right: 6px;'
      }),
    });
  },
};

export default ThreadCaratMenu;
