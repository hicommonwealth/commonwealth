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

export const getThreadSubScriptionMenuItem = (proposal: Thread) => {
  const commentSubscription = app.user.notifications.subscriptions.find(
    (v) =>
      v.objectId === proposal.uniqueIdentifier &&
      v.category === NotificationCategories.NewComment
  );

  const reactionSubscription = app.user.notifications.subscriptions.find(
    (v) =>
      v.objectId === proposal.uniqueIdentifier &&
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
            proposal.uniqueIdentifier
          ),
          app.user.notifications.subscribe(
            NotificationCategories.NewComment,
            proposal.uniqueIdentifier
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
  };
};

export class DiscussionRowMenu
  implements m.ClassComponent<{ proposal: Thread }>
{
  view(vnode) {
    if (!app.isLoggedIn()) return;

    const { proposal } = vnode.attrs;

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
      proposal.author === app.user.activeAccount.address;

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
          popoverMenuItems={[
            getThreadSubScriptionMenuItem(proposal),
            ...(hasAdminPermissions ? [{ type: 'divider' }] : []),
            ...(hasAdminPermissions
              ? [
                  {
                    onclick: (e) => {
                      e.preventDefault();

                      app.threads.pin({ proposal }).then(() => m.redraw());
                    },
                    label: proposal.pinned ? 'Unpin thread' : 'Pin thread',
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
                          threadId: proposal.id,
                          readOnly: !proposal.readOnly,
                        })
                        .then(() => m.redraw());
                    },
                    label: proposal.readOnly ? 'Unlock thread' : 'Lock thread',
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
                            proposal.topic = topic;
                            m.redraw();
                          },
                          thread: proposal,
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
                            proposal.stage = stage;
                            m.redraw();
                          },
                          thread: proposal,
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

                      app.threads.delete(proposal).then(() => {
                        navigateToSubpage('/');
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
