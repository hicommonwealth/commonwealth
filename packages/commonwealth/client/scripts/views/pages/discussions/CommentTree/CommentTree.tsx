import { ContentType } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { SessionKeyError } from 'controllers/server/sessions';
import { GetThreadActionTooltipTextResponse } from 'helpers/threads';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { CommentsFeaturedFilterTypes } from 'models/types';
import type { DeltaStatic } from 'quill';
import React, { useEffect, useRef, useState } from 'react';
import app from 'state';
import {
  useDeleteCommentMutation,
  useEditCommentMutation,
  useFetchCommentsQuery,
  useToggleCommentSpamStatusMutation,
} from 'state/api/comments';
import useUserStore from 'state/ui/user';
import { CreateComment } from 'views/components/Comments/CreateComment';
import {
  deserializeDelta,
  serializeDelta,
} from 'views/components/react_quill_editor/utils';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { notifyError } from '../../../../controllers/app/notifications';
import type { Comment as CommentType } from '../../../../models/Comment';
import Thread from '../../../../models/Thread';
import Permissions from '../../../../utils/Permissions';
import { CommentCard } from '../CommentCard';
import { clearEditingLocalStorage } from '../CommentTree/helpers';
import './CommentTree.scss';
import { jumpHighlightComment } from './helpers';
import usePrepareCommentsList from './usePrepareCommentsList';

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
  canReact?: boolean;
  canReply?: boolean;
  canComment: boolean;
  commentSortType: CommentsFeaturedFilterTypes;
  disabledActionsTooltipText?: GetThreadActionTooltipTextResponse;
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
  canReact = true,
  canReply = true,
  canComment,
  commentSortType,
  disabledActionsTooltipText,
}: CommentsTreeAttrs) => {
  const urlParams = new URLSearchParams(location.search);
  const focusCommentsParam = urlParams.get('focusComments') === 'true';

  const user = useUserStore();

  useEffect(() => {
    let timeout;

    if (focusCommentsParam) {
      timeout = setTimeout(() => {
        const ele = document.getElementsByClassName('CommentsTree')[0];
        ele.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }

    return () => {
      timeout !== undefined && clearTimeout(timeout);
    };
    // we only want to run this on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [highlightedComment, setHighlightedComment] = useState(false);

  const { data: allComments = [] } = useFetchCommentsQuery({
    communityId: app.activeChainId(),
    threadId: parseInt(`${thread.id}`),
  });

  const {
    mutateAsync: deleteComment,
    reset: resetDeleteCommentMutation,
    error: deleteCommentError,
  } = useDeleteCommentMutation({
    communityId: app.activeChainId(),
    threadId: thread.id,
    existingNumberOfComments: thread.numberOfComments,
  });

  const {
    mutateAsync: editComment,
    reset: resetEditCommentMutation,
    error: editCommentError,
  } = useEditCommentMutation({
    communityId: app.activeChainId(),
    threadId: thread.id,
  });

  const resetSessionRevalidationModal = deleteCommentError
    ? resetDeleteCommentMutation
    : resetEditCommentMutation;

  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: resetSessionRevalidationModal,
    error: deleteCommentError || editCommentError,
  });

  const { mutateAsync: toggleCommentSpamStatus } =
    useToggleCommentSpamStatusMutation({
      communityId: app.activeChainId(),
      threadId: thread.id,
    });

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

  const commentsList = usePrepareCommentsList({
    levelZeroComments: comments,
    allComments,
    threadId: thread.id,
    includeSpams,
    commentSortType,
    isLocked,
    // @ts-expect-error <StrictNullChecks/>
    fromDiscordBot,
    isLoggedIn,
  });

  const scrollToRef = useRef(null);

  const scrollToElement = () => {
    if (scrollToRef.current) {
      // @ts-expect-error <StrictNullChecks/>
      scrollToRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const handleIsReplying = (isReplying: boolean, id?: number) => {
    if (isReplying) {
      // @ts-expect-error <StrictNullChecks/>
      setParentCommentId(id);
      setIsReplying(true);
    } else {
      // @ts-expect-error <StrictNullChecks/>
      setParentCommentId(undefined);
      setIsReplying(false);
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
                canvasHash: comment.canvasHash,
                communityId: app.activeChainId(),
                address: user.activeAccount?.address || '',
                existingNumberOfComments: thread.numberOfComments,
              });
            } catch (err) {
              if (err instanceof SessionKeyError) {
                return;
              }
              console.error(err.response.data.error || err?.message);
              notifyError('Failed to delete comment');
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
    hasContentChanged: boolean,
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
                  // @ts-expect-error <StrictNullChecks/>
                  ...(p[comment.id] || {}),
                  isEditing: false,
                  editDraft: '',
                },
              }));
              // @ts-expect-error <StrictNullChecks/>
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
          // @ts-expect-error <StrictNullChecks/>
          ...(p[comment.id] || {}),
          isEditing: false,
          editDraft: '',
        },
      }));
      // @ts-expect-error <StrictNullChecks/>
      setIsGloballyEditing(false);
    }
  };

  const handleEditStart = (comment: CommentType<any>) => {
    const editDraft = localStorage.getItem(
      `${app.activeChainId()}-edit-comment-${comment.id}-storedText`,
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
              // @ts-expect-error <StrictNullChecks/>
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
              // @ts-expect-error <StrictNullChecks/>
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
      // @ts-expect-error <StrictNullChecks/>
      setIsGloballyEditing(true);
    }
  };

  const handleEditConfirm = async (
    comment: CommentType<any>,
    newDelta: DeltaStatic,
  ) => {
    setEdits((p) => ({
      ...p,
      [comment.id]: {
        // @ts-expect-error <StrictNullChecks/>
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
        communityId: app.activeChainId(),
        profile: {
          id: user.activeAccount?.profile?.id || 0,
          address: user.activeAccount?.address || '',
          avatarUrl: user.activeAccount?.profile?.avatarUrl || '',
          name: user.activeAccount?.profile?.name || '',
          lastActive: user.activeAccount?.profile?.lastActive.toString() || '',
        },
      });
      setEdits((p) => ({
        ...p,
        [comment.id]: {
          // @ts-expect-error <StrictNullChecks/>
          ...(p[comment.id] || {}),
          isEditing: false,
        },
      }));

      // @ts-expect-error <StrictNullChecks/>
      setIsGloballyEditing(false);
      clearEditingLocalStorage(comment.id, ContentType.Comment);
    } catch (err) {
      if (err instanceof SessionKeyError) {
        return;
      }
      console.error(err?.responseJSON?.error || err?.message);
      notifyError('Failed to edit comment');
    } finally {
      setEdits((p) => ({
        ...p,
        [comment.id]: {
          // @ts-expect-error <StrictNullChecks/>
          ...(p[comment.id] || {}),
          isSavingEdit: false,
        },
      }));
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
            flagged as spam are hidden from the main feed and can&apos;t be
            interacted with. For transparency, spam can still be viewed by
            community members if they choose to &quot;Include comments flagged
            as spam.&quot;
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
            they choose to &quot;Include comments flagged as spam.&quot;
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
                communityId: app.activeChainId(),
                address: user.activeAccount?.address || '',
              });
            } catch (err) {
              console.log(err);
            }
          },
        },
      ],
    });
  };

  return (
    <>
      <div className="CommentsTree">
        {commentsList.map((comment, index) => {
          const nextComment = commentsList[index + 1];
          const nextCommentThreadLevel = nextComment?.threadLevel;

          return (
            <React.Fragment key={comment.id + '' + comment.markedAsSpamAt}>
              <div className={`Comment comment-${comment.id}`}>
                {comment.threadLevel > 0 && (
                  <div className="thread-connectors-container">
                    {Array(comment.threadLevel)
                      .fill(undefined)
                      .map((_, i) => (
                        <div
                          key={i}
                          className={clsx('thread-connector', {
                            replying:
                              isReplying &&
                              i === comment.threadLevel - 1 &&
                              parentCommentId === comment.id,
                            // vertical line is shorter when the thread is finished
                            smaller:
                              i >= nextCommentThreadLevel || !nextComment,
                          })}
                        />
                      ))}
                  </div>
                )}
                <CommentCard
                  disabledActionsTooltipText={disabledActionsTooltipText}
                  isThreadArchived={!!thread.archivedAt}
                  canReply={
                    !!user.activeAccount &&
                    !thread.archivedAt &&
                    !thread.lockedAt &&
                    canReply
                  }
                  maxReplyLimitReached={comment.maxReplyLimitReached}
                  canReact={
                    !thread.archivedAt &&
                    (!!user.activeAccount || isAdmin) &&
                    canReact
                  }
                  canEdit={
                    !isLocked && (comment.isCommentAuthor || isAdminOrMod)
                  }
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
                  canDelete={
                    !isLocked && (comment.isCommentAuthor || isAdminOrMod)
                  }
                  replyBtnVisible={comment.replyBtnVisible}
                  onReply={() => {
                    setParentCommentId(comment.id);
                    setIsReplying(true);
                    scrollToElement();
                  }}
                  onDelete={async () => await handleDeleteComment(comment)}
                  isSpam={!!comment.markedAsSpamAt}
                  onSpamToggle={async () => await handleFlagMarkAsSpam(comment)}
                  canToggleSpam={
                    !isLocked && (comment.isCommentAuthor || isAdminOrMod)
                  }
                  comment={comment}
                  shareURL={`${window.location.origin}${window.location.pathname}?comment=${comment.id}`}
                />
              </div>
              <div ref={scrollToRef}></div>
              {isReplying && parentCommentId === comment.id && (
                <CreateComment
                  handleIsReplying={handleIsReplying}
                  parentCommentId={parentCommentId}
                  rootThread={thread}
                  canComment={canComment}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {RevalidationModal}
    </>
  );
};
