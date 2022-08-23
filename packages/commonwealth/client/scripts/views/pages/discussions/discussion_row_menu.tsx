/* @jsx m */

import m from 'mithril';
import { MenuItem, PopoverMenu, MenuDivider } from 'construct-ui';

import 'pages/discussions/discussion_row_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { NotificationCategories } from 'common-common/src/types';
import { Thread, ThreadStage, Topic } from 'models';
import { notifySuccess } from 'controllers/app/notifications';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { UpdateProposalStatusModal } from '../../modals/update_proposal_status_modal';
import { ChangeTopicModal } from '../../modals/change_topic_modal';

type ThreadMenuItemAttrs = { proposal: Thread };

export class ThreadSubscriptionMenuItem
  implements m.ClassComponent<ThreadMenuItemAttrs>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

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

    return (
      <MenuItem
        onclick={async (e) => {
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
        }}
        label={
          bothActive
            ? 'Unsubscribe from notifications'
            : 'Subscribe to notifications'
        }
      />
    );
  }
}

export class ChangeTopicMenuItem
  implements
    m.ClassComponent<{
      onChangeHandler: (topic: Topic) => void;
      proposal: Thread;
    }>
{
  view(vnode) {
    const { onChangeHandler, proposal } = vnode.attrs;

    return (
      <MenuItem
        label="Change topic"
        onclick={(e) => {
          e.preventDefault();
          app.modals.create({
            modal: ChangeTopicModal,
            data: {
              onChangeHandler,
              thread: proposal,
            },
          });
        }}
      />
    );
  }
}

class UpdateProposalStatusMenuItem
  implements
    m.ClassComponent<{
      onChangeHandler: (stage: ThreadStage) => void;
      proposal: Thread;
    }>
{
  view(vnode) {
    const { onChangeHandler, proposal } = vnode.attrs;

    if (!app.chain?.meta) return;

    const { stagesEnabled } = app.chain?.meta;

    if (!stagesEnabled) return;

    return (
      <MenuItem
        label="Update proposal status"
        onclick={(e) => {
          e.preventDefault();
          app.modals.create({
            modal: UpdateProposalStatusModal,
            data: {
              onChangeHandler,
              thread: proposal,
            },
          });
        }}
      />
    );
  }
}

class ThreadDeletionMenuItem implements m.ClassComponent<ThreadMenuItemAttrs> {
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <MenuItem
        onclick={async (e) => {
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
        }}
        label="Delete"
      />
    );
  }
}

export class DiscussionRowMenu
  implements m.ClassComponent<ThreadMenuItemAttrs>
{
  view(vnode) {
    if (!app.isLoggedIn()) return;

    const { proposal } = vnode.attrs;

    const hasAdminPermissions =
      app.user.activeAccount &&
      (app.user.isRoleOfCommunity({
        role: 'admin',
        chain: app.activeChainId(),
      }) ||
        app.user.isRoleOfCommunity({
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
        <PopoverMenu
          transitionDuration={0}
          closeOnOutsideClick={true}
          closeOnContentClick={true}
          menuAttrs={{}}
          content={[
            <ThreadSubscriptionMenuItem proposal={proposal} />,
            hasAdminPermissions && <MenuDivider />,
            hasAdminPermissions && (
              <MenuItem
                onclick={(e) => {
                  e.preventDefault();
                  app.threads.pin({ proposal }).then(() => m.redraw());
                }}
                label={proposal.pinned ? 'Unpin thread' : 'Pin thread'}
              />
            ),
            hasAdminPermissions && (
              <MenuItem
                onclick={(e) => {
                  e.preventDefault();
                  app.threads
                    .setPrivacy({
                      threadId: proposal.id,
                      readOnly: !proposal.readOnly,
                    })
                    .then(() => m.redraw());
                }}
                label={proposal.readOnly ? 'Unlock thread' : 'Lock thread'}
              />
            ),
            hasAdminPermissions && (
              <ChangeTopicMenuItem
                proposal={proposal}
                onChangeHandler={(topic: Topic) => {
                  proposal.topic = topic;
                  m.redraw();
                }}
              />
            ),
            (isAuthor || hasAdminPermissions) && (
              <UpdateProposalStatusMenuItem
                proposal={proposal}
                onChangeHandler={(stage: ThreadStage) => {
                  proposal.stage = stage;
                  m.redraw();
                }}
              />
            ),
            (isAuthor || hasAdminPermissions || app.user.isSiteAdmin) && (
              <ThreadDeletionMenuItem proposal={proposal} />
            ),
          ]}
          trigger={
            <div>
              <CWIcon iconName="chevronDown" iconSize="small" />
            </div>
          }
        />
      </div>
    );
  }
}
