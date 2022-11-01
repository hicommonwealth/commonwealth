/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/view_thread/thread_body.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { Comment, Thread, ThreadStage as ThreadStageType, Topic } from 'models';
import { pluralize } from 'helpers';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { ContentType } from 'types';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { SharePopover } from '../../components/share_popover';
import { getThreadSubScriptionMenuItem } from '../discussions/discussion_row_menu';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { EditCollaboratorsModal } from '../../modals/edit_collaborators_modal';
import { ChangeTopicModal } from '../../modals/change_topic_modal';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ThreadReactionButton } from '../../components/reaction_button/thread_reaction_button';
import { ExternalLink, ThreadAuthor, ThreadStage } from './thread_components';
import { CommentsTree } from '../../components/comments/comments_tree';
import { CreateComment } from '../../components/comments/create_comment';
import { CollapsibleBodyText } from '../../components/collapsible_body_text';
import { EditBody } from './edit_body';
import { clearEditingLocalStorage } from '../../components/comments/helpers';

type ThreadBodyAttrs = {
  commentCount: number;
  comments: Array<Comment<Thread>>;
  isAdminOrMod: boolean;
  isAuthor: boolean;
  isEditor: boolean;
  isGloballyEditing: boolean;
  thread: Thread;
  setIsGloballyEditing: (status: boolean) => void;
  updatedCommentsCallback: () => void;
  viewCount: number;
};

export class ThreadBody implements m.ClassComponent<ThreadBodyAttrs> {
  private isEditingBody: boolean;
  private savedEdits: string;
  private shouldRestoreEdits: boolean;
  private title: string;

  oninit(vnode) {
    this.title = vnode.attrs.thread.title;
  }

  view(vnode) {
    const {
      commentCount,
      comments,
      updatedCommentsCallback,
      setIsGloballyEditing,
      isAdminOrMod,
      isAuthor,
      isEditor,
      isGloballyEditing,
      thread,
      viewCount,
    } = vnode.attrs;

    const setIsEditingBody = (status: boolean) => {
      setIsGloballyEditing(status);
      this.isEditingBody = status;
    };

    const hasEditPerms = isAuthor || isAdminOrMod || isEditor;

    const canComment =
      app.user.activeAccount ||
      (!isAdminOrMod && TopicGateCheck.isGatedTopic(thread?.topic?.name));

    const reactionsAndReplyButtons = (
      <div class="thread-footer-row">
        <ThreadReactionButton thread={thread} />
        <div class="comments-count">
          <CWIcon iconName="feedback" iconSize="small" />
          <CWText type="caption">{commentCount} Comments</CWText>
        </div>
      </div>
    );

    return (
      <div class="ThreadBody">
        <div class="header">
          {this.isEditingBody ? (
            <CWTextInput
              oninput={(e) => {
                this.title = e.target.value;
              }}
              value={this.title}
            />
          ) : (
            <CWText type="h3" fontWeight="semiBold">
              {thread.title}
            </CWText>
          )}
          <div class="info-and-menu-row">
            <ThreadAuthor thread={thread} />
            <CWText type="caption" className="header-text">
              published on {moment(thread.createdAt).format('l')}
            </CWText>
            <CWText type="caption" className="header-text">
              {pluralize(viewCount, 'view')}
            </CWText>
            {thread.readOnly && <CWIcon iconName="lock" iconSize="small" />}
            {thread.stage !== ThreadStageType.Discussion && (
              <ThreadStage proposal={thread} />
            )}
            <SharePopover />
            {app.isLoggedIn() && hasEditPerms && !isGloballyEditing && (
              <CWPopoverMenu
                menuItems={[
                  ...(hasEditPerms && !thread.readOnly
                    ? [
                        {
                          label: 'Edit',
                          iconLeft: 'write',
                          onclick: async (e) => {
                            e.preventDefault();
                            this.savedEdits = localStorage.getItem(
                              `${app.activeChainId()}-edit-thread-${
                                thread.id
                              }-storedText`
                            );

                            if (this.savedEdits) {
                              clearEditingLocalStorage(
                                thread.id,
                                ContentType.Thread
                              );
                              this.shouldRestoreEdits =
                                await confirmationModalWithText(
                                  'Previous changes found. Restore edits?',
                                  'Yes',
                                  'No'
                                )();
                            }

                            setIsEditingBody(true);
                          },
                        },
                      ]
                    : []),
                  ...(isAuthor
                    ? [
                        {
                          label: 'Edit collaborators',
                          iconLeft: 'write',
                          onclick: async (e) => {
                            e.preventDefault();
                            app.modals.create({
                              modal: EditCollaboratorsModal,
                              data: {
                                thread,
                              },
                            });
                          },
                        },
                      ]
                    : []),
                  ...(isAdminOrMod
                    ? [
                        {
                          label: 'Change topic',
                          iconLeft: 'write',
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
                        },
                      ]
                    : []),
                  ...(isAuthor || isAdminOrMod || app.user.isSiteAdmin
                    ? [
                        {
                          label: 'Delete',
                          iconLeft: 'trash',
                          onclick: async (e) => {
                            e.preventDefault();

                            const confirmed = await confirmationModalWithText(
                              'Delete this entire thread?'
                            )();

                            if (!confirmed) return;

                            app.threads.delete(thread).then(() => {
                              navigateToSubpage('/discussions');
                            });
                          },
                        },
                      ]
                    : []),
                  ...(isAuthor || isAdminOrMod
                    ? [
                        {
                          label: thread.readOnly
                            ? 'Unlock thread'
                            : 'Lock thread',
                          iconLeft: 'lock',
                          onclick: (e) => {
                            e.preventDefault();
                            app.threads
                              .setPrivacy({
                                threadId: thread.id,
                                readOnly: !thread.readOnly,
                              })
                              .then(() => {
                                setIsEditingBody(false);
                                m.redraw();
                              });
                          },
                        },
                      ]
                    : []),
                  ...((isAuthor || isAdminOrMod) &&
                  !!app.chain?.meta.snapshot.length
                    ? [
                        {
                          label: 'Snapshot proposal from thread',
                          iconLeft: 'democraticProposal',
                          onclick: () => {
                            const snapshotSpaces = app.chain.meta.snapshot;

                            if (snapshotSpaces.length > 1) {
                              navigateToSubpage('/multiple-snapshots', {
                                action: 'create-from-thread',
                                thread,
                              });
                            } else {
                              navigateToSubpage(`/snapshot/${snapshotSpaces}`);
                            }
                          },
                        },
                      ]
                    : []),
                  ...(isAuthor || isAdminOrMod
                    ? [
                        { type: 'divider' },
                        getThreadSubScriptionMenuItem(thread),
                      ]
                    : []),
                ]}
                trigger={
                  <CWIconButton iconName="dotsVertical" iconSize="small" />
                }
              />
            )}
          </div>
        </div>
        <CWDivider />
        {!!thread.url && <ExternalLink proposal={thread} />}
        <div class="thread-content">
          {this.isEditingBody ? (
            <>
              {reactionsAndReplyButtons}
              <EditBody
                thread={thread}
                savedEdits={this.savedEdits}
                shouldRestoreEdits={this.shouldRestoreEdits}
                setIsEditing={setIsEditingBody}
                title={this.title}
              />
            </>
          ) : (
            <>
              <CollapsibleBodyText item={thread} />
              {thread.readOnly ? (
                <CWText type="h5" className="callout-text">
                  Commenting is disabled because this post has been locked.
                </CWText>
              ) : !isGloballyEditing && canComment ? (
                <>
                  {reactionsAndReplyButtons}
                  <CreateComment
                    updatedCommentsCallback={updatedCommentsCallback}
                    setIsGloballyEditing={setIsGloballyEditing}
                    isGloballyEditing={isGloballyEditing}
                    parentComment={null}
                    rootProposal={thread}
                  />
                </>
              ) : null}
            </>
          )}
        </div>
        <CommentsTree
          comments={comments}
          proposal={thread}
          setIsGloballyEditing={setIsGloballyEditing}
          updatedCommentsCallback={updatedCommentsCallback}
        />
      </div>
    );
  }
}
