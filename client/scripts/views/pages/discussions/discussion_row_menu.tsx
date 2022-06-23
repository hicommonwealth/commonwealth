/* @jsx m */

import m from 'mithril';
import { MenuItem, PopoverMenu, MenuDivider } from 'construct-ui';

import 'pages/discussions/discussion_row_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { NotificationCategories } from 'types';
import { Thread, Topic, ThreadStage } from 'models';
import { TopicEditor } from 'views/components/topic_editor';
import { StageEditor } from 'views/components/stage_editor';
import { notifySuccess } from 'controllers/app/notifications';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

type ThreadMenuItemAttrs = { proposal: Thread };

type EditorMenuItemAttrs = { openTopicEditor: () => void };

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

export class TopicEditorMenuItem
  implements m.ClassComponent<EditorMenuItemAttrs>
{
  view(vnode) {
    const { openTopicEditor } = vnode.attrs;

    return (
      <MenuItem
        fluid={true}
        label="Edit topic"
        onclick={(e) => {
          e.preventDefault();
          openTopicEditor();
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

class StageEditorMenuItem implements m.ClassComponent<ThreadMenuItemAttrs> {
  view(vnode) {
    const { openStageEditor } = vnode.attrs;

    if (!app.chain?.meta) return;

    const { stagesEnabled } = app.chain?.meta;

    if (!stagesEnabled) return;

    return (
      <MenuItem
        fluid={true}
        label="Edit stage"
        onclick={(e) => {
          e.preventDefault();
          openStageEditor();
        }}
      />
    );
  }
}

export class DiscussionRowMenu
  implements m.ClassComponent<ThreadMenuItemAttrs>
{
  private topicEditorIsOpen: boolean;
  private stageEditorIsOpen: boolean;

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
              <TopicEditorMenuItem
                openTopicEditor={() => {
                  this.topicEditorIsOpen = true;
                }}
              />
            ),
            (isAuthor || hasAdminPermissions) && (
              <StageEditorMenuItem
                openStageEditor={() => {
                  this.stageEditorIsOpen = true;
                }}
              />
            ),
            (isAuthor || hasAdminPermissions || app.user.isSiteAdmin) && (
              <ThreadDeletionMenuItem proposal={proposal} />
            ),
          ]}
          trigger={<CWIcon iconName="chevronDown" iconSize="small" />}
        />
        {this.topicEditorIsOpen && (
          <TopicEditor
            thread={vnode.attrs.proposal}
            popoverMenu={true}
            onChangeHandler={(topic: Topic) => {
              proposal.topic = topic;
              m.redraw();
            }}
            openStateHandler={(v) => {
              this.topicEditorIsOpen = v;
              m.redraw();
            }}
          />
        )}
        {this.stageEditorIsOpen && (
          <StageEditor
            thread={vnode.attrs.proposal}
            popoverMenu={true}
            onChangeHandler={(stage: ThreadStage) => {
              proposal.stage = stage;
              m.redraw();
            }}
            openStateHandler={(v) => {
              this.stageEditorIsOpen = v;
              m.redraw();
            }}
          />
        )}
      </div>
    );
  }
}
