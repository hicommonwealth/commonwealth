/* @jsx m */

import m from 'mithril';

import 'pages/discussions/discussion_row_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { NotificationCategories } from 'common-common/src/types';
import { Thread, ThreadStage, Topic } from 'models';
import { notifySuccess } from 'controllers/app/notifications';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { UpdateProposalStatusModal } from '../../modals/update_proposal_status_modal';
import { ChangeTopicModal } from '../../modals/change_topic_modal';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';

export const getThreadSubScriptionMenuItem = (thread: Thread) => {
  const commentSubscription = app.user.notifications.subscriptions.find(
    (v) =>
      v.objectId === thread.uniqueIdentifier &&
      v.category === NotificationCategories.NewComment
  );

  const reactionSubscription = app.user.notifications.subscriptions.find(
    (v) =>
      v.objectId === thread.uniqueIdentifier &&
      v.category === NotificationCategories.NewReaction
  );

  const bothActive =
    commentSubscription?.isActive && reactionSubscription?.isActive;

  return {
    onclick: async (e) => {
      e.preventDefault();
      if (!commentSubscription || !reactionSubscription) {
        await Promise.all([
          app.user.notifications.subscribe(
            NotificationCategories.NewReaction,
            thread.uniqueIdentifier
          ),
          app.user.notifications.subscribe(
            NotificationCategories.NewComment,
            thread.uniqueIdentifier
          ),
        ]);
        notifySuccess('Subscribed!');
      } else if (bothActive) {
        await app.user.notifications.disableSubscriptions([
          commentSubscription,
          reactionSubscription,
        ]);
        notifySuccess('Unsubscribed!');
      } else {
        await app.user.notifications.enableSubscriptions([
          commentSubscription,
          reactionSubscription,
        ]);
        notifySuccess('Subscribed!');
      }
      m.redraw();
    },
    label: bothActive ? 'Unsubscribe' : 'Subscribe',
    iconLeft: 'bell',
  };
};

export class DiscussionRowMenu implements m.ClassComponent<{ thread: Thread }> {
  view(vnode) {
    if (!app.isLoggedIn()) return;

    const { thread } = vnode.attrs;

    const hasAdminPermissions =
      app.user.activeAccount &&
      (app.roles.isRoleOfCommunity({
        role: 'admin',
        chain: app.activeChainId(),
      }) ||
        app.roles.isRoleOfCommunity({
          role: 'moderator',
          chain: app.activeChainId(),
        }));

    const isAuthor =
      app.user.activeAccount &&
      thread.author === app.user.activeAccount.address;

    return (
      <div
        class="DiscussionRowMenu"
        onclick={(e) => {
          // prevent clicks from propagating to discussion row
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <CWPopoverMenu
          menuItems={[
            getThreadSubScriptionMenuItem(thread),
            ...(hasAdminPermissions ? [{ type: 'divider' }] : []),
            ...(hasAdminPermissions
              ? [
                  {
                    onclick: (e) => {
                      e.preventDefault();

                      app.threads
                        .pin({ proposal: thread })
                        .then(() => m.redraw());
                    },
                    label: thread.pinned ? 'Unpin thread' : 'Pin thread',
                  },
                ]
              : []),
            ...(hasAdminPermissions
              ? [
                  {
                    onclick: (e) => {
                      e.preventDefault();

                      app.threads
                        .setPrivacy({
                          threadId: thread.id,
                          readOnly: !thread.readOnly,
                        })
                        .then(() => m.redraw());
                    },
                    label: thread.readOnly ? 'Unlock thread' : 'Lock thread',
                  },
                ]
              : []),
            ...(hasAdminPermissions
              ? [
                  {
                    onclick: (e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: ChangeTopicModal,
                        data: {
                          onChangeHandler: (topic: Topic) => {
                            thread.topic = topic;
                            m.redraw();
                          },
                          thread,
                        },
                      });
                    },
                    label: 'Change topic',
                  },
                ]
              : []),
            ...(isAuthor || hasAdminPermissions
              ? [
                  {
                    onclick: (e) => {
                      e.preventDefault();
                      app.modals.create({
                        modal: UpdateProposalStatusModal,
                        data: {
                          onChangeHandler: (stage: ThreadStage) => {
                            thread.stage = stage;
                            m.redraw();
                          },
                          thread,
                        },
                      });
                    },
                    label: 'Update status',
                  },
                ]
              : []),
            ...(isAuthor || hasAdminPermissions || app.user.isSiteAdmin
              ? [
                  {
                    onclick: async (e) => {
                      e.preventDefault();

                      const carat = document.getElementsByClassName(
                        'cui-popover-trigger-active'
                      )[0] as HTMLButtonElement;

                      if (carat) carat.click();

                      const confirmed = await confirmationModalWithText(
                        'Delete this entire thread?'
                      )();

                      if (!confirmed) return;

                      app.threads.delete(thread).then(() => {
                        navigateToSubpage('/discussions');
                      });
                    },
                    label: 'Delete',
                  },
                ]
              : []),
          ]}
          trigger={<CWIconButton iconName="chevronDown" iconSize="small" />}
        />
      </div>
    );
  }
}
