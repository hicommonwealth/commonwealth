import useUserLoggedIn from 'hooks/useUserLoggedIn';
import type { DeltaStatic } from 'quill';
import React, { useEffect, useState } from 'react';
import app from 'state';
import {
  useDeleteCommentMutation,
  useEditCommentMutation,
  useFetchCommentsQuery,
  useToggleCommentSpamStatusMutation,
} from 'state/api/comments';
import { ContentType } from 'types';
import { CreateComment } from 'views/components/Comments/CreateComment';
import { CWValidationText } from 'views/components/component_kit/cw_validation_text';
import {
  deserializeDelta,
  serializeDelta,
} from 'views/components/react_quill_editor/utils';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { notifyError } from '../../../../controllers/app/notifications';
import type { Comment as CommentType } from '../../../../models/Comment';
import Thread from '../../../../models/Thread';
import Permissions from '../../../../utils/Permissions';
import { CommentCard } from '../CommentCard';
import { clearEditingLocalStorage } from '../CommentTree/helpers';
import './CommentTree.scss';
import { jumpHighlightComment } from './helpers';
import useUserActiveAccount from 'hooks/useUserActiveAccount';

const MAX_THREAD_LEVEL = 8;

type CommentsTreeAttrs = {
  comments: Array<CommentType<any>>;
  thread: Thread;
  setIsGloballyEditing?: (status: boolean) => void;
  includeSpams: boolean;
  isReplying: boolean;
  setIsReplying: (status: boolean) => void;
  parentCommentId: number;
  setParentCommentId: (id: number) => void;
  fromDiscordBot?: boolean;
  canComment: boolean;
};

export const CommentTree = ({
  comments,
  thread,
  setIsGloballyEditing,
  includeSpams,
  fromDiscordBot,
  isReplying,
  setIsReplying,
  parentCommentId,
  setParentCommentId,
  canComment,
}: CommentsTreeAttrs) => {
  const [commentError] = useState(null);
  const [highlightedComment, setHighlightedComment] = useState(false);

  const { data: allComments = [] } = useFetchCommentsQuery({
    chainId: app.activeChainId(),
    threadId: parseInt(`${thread.id}`),
  });

  const { mutateAsync: deleteComment } = useDeleteCommentMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
    existingNumberOfComments: thread.numberOfComments,
  });

  const { mutateAsync: editComment } = useEditCommentMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
  });

  const { mutateAsync: toggleCommentSpamStatus } =
    useToggleCommentSpamStatusMutation({
      chainId: app.activeChainId(),
      threadId: thread.id,
    });

  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const [edits, setEdits] = useState<{
    [commentId: number]: {
      isEditing?: boolean;
      editDraft?: string;
      isSavingEdit?: boolean;
      contentDelta?: DeltaStatic;
    };
  }>();

  const { isLoggedIn } = useUserLoggedIn();

  const isAdminOrMod =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin() ||
    Permissions.isCommunityModerator();

  const isLocked = !!(thread instanceof Thread && thread.readOnly);

  useEffect(() => {
    if (comments?.length > 0 && !highlightedComment) {
      setHighlightedComment(true);

      const commentId = window.location.search.startsWith('?comment=')
        ? window.location.search.replace('?comment=', '')
        : null;

      if (commentId) jumpHighlightComment(Number(commentId));
    }
  }, [comments?.length, highlightedComment]);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const handleIsReplying = (isReplying: boolean, id?: number) => {
    if (isReplying) {
      setParentCommentId(id);
      setIsReplying(true);
    } else {
      setParentCommentId(undefined);
      setIsReplying(false);
    }
  };

  const isLivingCommentTree = (comment, children) => {
    if (!comment.deleted) {
      return true;
    } else if (!children.length) {
      return false;
    } else {
      let survivingDescendents = false;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (!child.deleted) {
          survivingDescendents = true;
          break;
        }

        const grandchildren = allComments.filter(
          (c) => c.threadId === thread.id && c.parentComment === comment.id
        );

        for (let j = 0; j < grandchildren.length; j++) {
          const grandchild = grandchildren[j];

          if (!grandchild.deleted) {
            survivingDescendents = true;
            break;
          }
        }

        if (survivingDescendents) break;
      }

      return survivingDescendents;
    }
  };

  const handleDeleteComment = (comment: CommentType<any>) => {
    openConfirmation({
      title: 'Delete Comment',
      description: <>Delete this comment?</>,
      buttons: [
        {
          label: 'Delete',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await deleteComment({
                commentId: comment.id,
                canvasHash: comment.canvas_hash,
                chainId: app.activeChainId(),
                address: app.user.activeAccount.address,
                existingNumberOfComments: thread.numberOfComments,
              });
            } catch (e) {
              console.log(e);
              notifyError('Failed to delete comment.');
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'primary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  const handleEditCancel = (
    comment: CommentType<any>,
    hasContentChanged: boolean
  ) => {
    if (hasContentChanged) {
      openConfirmation({
        title: 'Cancel editing?',
        description: <>Changes will not be saved.</>,
        buttons: [
          {
            label: 'Yes',
            buttonType: 'primary',
            buttonHeight: 'sm',
            onClick: () => {
              setEdits((p) => ({
                ...p,
                [comment.id]: {
                  ...(p[comment.id] || {}),
                  isEditing: false,
                  editDraft: '',
                },
              }));
              setIsGloballyEditing(false);
              clearEditingLocalStorage(comment.id, ContentType.Comment);
            },
          },
          {
            label: 'No',
            buttonType: 'secondary',
            buttonHeight: 'sm',
          },
        ],
      });
    } else {
      setEdits((p) => ({
        ...p,
        [comment.id]: {
          ...(p[comment.id] || {}),
          isEditing: false,
          editDraft: '',
        },
      }));
      setIsGloballyEditing(false);
    }
  };

  const handleEditStart = (comment: CommentType<any>) => {
    const editDraft = localStorage.getItem(
      `${app.activeChainId()}-edit-comment-${comment.id}-storedText`
    );
    if (editDraft) {
      clearEditingLocalStorage(comment.id, ContentType.Comment);
      const body = deserializeDelta(editDraft);

      openConfirmation({
        title: 'Info',
        description: <>Previous changes found. Restore edits?</>,
        buttons: [
          {
            label: 'Restore',
            buttonType: 'primary',
            buttonHeight: 'sm',
            onClick: () => {
              setEdits((p) => ({
                ...p,
                [comment.id]: {
                  ...(p?.[comment.id] || {}),
                  isEditing: true,
                  editDraft: editDraft,
                  contentDelta: body,
                },
              }));
              setIsGloballyEditing(true);
            },
          },
          {
            label: 'Cancel',
            buttonType: 'secondary',
            buttonHeight: 'sm',
            onClick: () => {
              setEdits((p) => ({
                ...p,
                [comment.id]: {
                  ...(p?.[comment.id] || {}),
                  isEditing: true,
                  editDraft: '',
                  contentDelta: body,
                },
              }));
              setIsGloballyEditing(true);
            },
          },
        ],
      });
    } else {
      setEdits((p) => ({
        ...p,
        [comment.id]: {
          ...(p?.[comment.id] || {}),
          isEditing: true,
          editDraft: '',
          contentDelta: deserializeDelta(comment.text),
        },
      }));
      setIsGloballyEditing(true);
    }
  };

  const handleEditConfirm = async (
    comment: CommentType<any>,
    newDelta: DeltaStatic
  ) => {
    {
      setEdits((p) => ({
        ...p,
        [comment.id]: {
          ...(p[comment.id] || {}),
          isSavingEdit: true,
        },
      }));

      try {
        await editComment({
          commentId: comment.id,
          updatedBody: serializeDelta(newDelta) || comment.text,
          threadId: thread.id,
          parentCommentId: comment.parentComment,
          chainId: app.activeChainId(),
          address: app.user.activeAccount.address,
        });
        setEdits((p) => ({
          ...p,
          [comment.id]: {
            ...(p[comment.id] || {}),
            isEditing: false,
          },
        }));
        setIsGloballyEditing(false);
        clearEditingLocalStorage(comment.id, ContentType.Comment);
      } catch (err) {
        console.error(err);
      } finally {
        setEdits((p) => ({
          ...p,
          [comment.id]: {
            ...(p[comment.id] || {}),
            isSavingEdit: false,
          },
        }));
      }
    }
  };

  const handleFlagMarkAsSpam = (comment: CommentType<any>) => {
    openConfirmation({
      title: !comment.markedAsSpamAt
        ? 'Confirm flag as spam'
        : 'Unflag as spam?',
      description: !comment.markedAsSpamAt ? (
        <>
          <p>Are you sure you want to flag this comment as spam?</p>
          <br />
          <p>
            Flagging as spam will help filter out unwanted content. Comments
            flagged as spam are hidden from the main feed and can't be
            interacted with. For transparency, spam can still be viewed by
            community members if they choose to "Include comments flagged as
            spam."
          </p>
          <br />
          <p>Note that you can always unflag a comment as spam.</p>
        </>
      ) : (
        <>
          <p>
            Are you sure you want to unflag this comment as spam? Flagging as
            spam will help filter out unwanted content.
          </p>
          <br />
          <p>
            For transparency, spam can still be viewed by community members if
            they choose to “Include comments flagged as spam.”
            <br />
          </p>
        </>
      ),
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'primary',
          buttonHeight: 'sm',
        },
        {
          label: !comment.markedAsSpamAt ? 'Confirm' : 'Unflag as spam?',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await toggleCommentSpamStatus({
                commentId: comment.id,
                isSpam: !comment.markedAsSpamAt,
                chainId: app.activeChainId(),
                address: app.user.activeAccount.address,
              });
            } catch (err) {
              console.log(err);
            }
          },
        },
      ],
    });
  };

  const recursivelyGatherComments = (
    comments_: CommentType<any>[],
    parentComment: CommentType<any>,
    threadLevel: number
  ) => {
    const canContinueThreading = threadLevel <= MAX_THREAD_LEVEL;

    return comments_
      .filter((x) => (includeSpams ? true : !x.markedAsSpamAt))
      .map((comment: CommentType<any>) => {
        const children = allComments.filter(
          (c) => c.threadId === thread.id && c.parentComment === comment.id
        );

        if (isLivingCommentTree(comment, children)) {
          const isCommentAuthor =
            comment.author === app.user.activeAccount?.address;

          const isLast = threadLevel === 8;

          const replyBtnVisible = !!(
            !isLast &&
            !isLocked &&
            !fromDiscordBot &&
            isLoggedIn
          );

          return (
            <React.Fragment key={comment.id + '' + comment.markedAsSpamAt}>
              <div className={`Comment comment-${comment.id}`}>
                {threadLevel > 0 && (
                  <div className="thread-connectors-container">
                    {Array(threadLevel)
                      .fill(undefined)
                      .map((_, i) => (
                        <div
                          key={i}
                          className={`thread-connector ${
                            isReplying &&
                            i === threadLevel - 1 &&
                            parentCommentId === comment.id
                              ? 'replying'
                              : ''
                          }`}
                        />
                      ))}
                  </div>
                )}
                <CommentCard
                  canReply={!!hasJoinedCommunity}
                  canReact={
                    !!hasJoinedCommunity ||
                    isAdmin ||
                    !app.chain.isGatedTopic(thread.topic.id)
                  }
                  canEdit={!isLocked && (isCommentAuthor || isAdminOrMod)}
                  editDraft={edits?.[comment.id]?.editDraft || ''}
                  onEditStart={async () => await handleEditStart(comment)}
                  onEditCancel={async (hasContentChanged: boolean) =>
                    await handleEditCancel(comment, hasContentChanged)
                  }
                  onEditConfirm={async (newDelta) =>
                    await handleEditConfirm(comment, newDelta)
                  }
                  isSavingEdit={edits?.[comment.id]?.isSavingEdit || false}
                  isEditing={edits?.[comment.id]?.isEditing || false}
                  canDelete={!isLocked && (isCommentAuthor || isAdminOrMod)}
                  replyBtnVisible={replyBtnVisible}
                  onReply={() => {
                    setParentCommentId(comment.id);
                    setIsReplying(true);
                  }}
                  onDelete={async () => await handleDeleteComment(comment)}
                  isSpam={!!comment.markedAsSpamAt}
                  onSpamToggle={async () => await handleFlagMarkAsSpam(comment)}
                  canToggleSpam={!isLocked && (isCommentAuthor || isAdminOrMod)}
                  comment={comment}
                />
              </div>
              {isReplying && parentCommentId === comment.id && (
                <CreateComment
                  handleIsReplying={handleIsReplying}
                  parentCommentId={parentCommentId}
                  rootThread={thread}
                  canComment={canComment}
                />
              )}
              {!!children.length &&
                canContinueThreading &&
                recursivelyGatherComments(children, comment, threadLevel + 1)}
            </React.Fragment>
          );
        } else {
          return null;
        }
      });
  };

  return (
    <div className="CommentsTree">
      {comments && recursivelyGatherComments(comments, comments[0], 0)}
      {commentError && (
        <CWValidationText message={commentError} status="failure" />
      )}
    </div>
  );
};
