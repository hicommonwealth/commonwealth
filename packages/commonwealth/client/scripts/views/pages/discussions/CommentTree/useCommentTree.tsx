import { ContentType } from '@hicommonwealth/shared';
import { SessionKeyError } from 'controllers/server/sessions';
import { CommentsFeaturedFilterTypes } from 'models/types';
import type { DeltaStatic } from 'quill';
import React, { useEffect, useRef, useState } from 'react';
import app from 'state';
import {
  useDeleteCommentMutation,
  useEditCommentMutation,
  useToggleCommentSpamStatusMutation,
} from 'state/api/comments';
import { buildUpdateCommentInput } from 'state/api/comments/editComment';
import { useAuthModalStore } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import {
  deserializeDelta,
  serializeDelta,
} from 'views/components/react_quill_editor/utils';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { notifyError } from '../../../../controllers/app/notifications';
import Thread from '../../../../models/Thread';
import Permissions from '../../../../utils/Permissions';
import { CommentViewParams } from '../CommentCard/CommentCard';
import './CommentTree.scss';
import { clearEditingLocalStorage } from './helpers';
import { CommentFilters, UseCommentsTreeProps } from './types';

export const useCommentTree = ({
  thread,
  setIsGloballyEditing,
  setIsReplying,
  setParentCommentId,
}: UseCommentsTreeProps) => {
  const urlParams = new URLSearchParams(location.search);
  const focusCommentsParam = urlParams.get('focusComments') === 'true';
  const [commentFilters, setCommentFilters] = useState<CommentFilters>({
    includeSpam: false,
    sortType: CommentsFeaturedFilterTypes.Newest,
  });

  const user = useUserStore();
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

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

  const communityId = app.activeChainId() || '';

  const { mutateAsync: deleteComment } = useDeleteCommentMutation({
    communityId,
    threadId: thread.id,
    existingNumberOfComments: thread.numberOfComments,
  });

  const { mutateAsync: editComment } = useEditCommentMutation({
    communityId,
    threadId: thread.id,
  });

  const { mutateAsync: toggleCommentSpamStatus } =
    useToggleCommentSpamStatusMutation({
      communityId,
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

  const isLocked = !!(thread instanceof Thread && thread.readOnly);

  // TODO: need to properly display deleted comment tree for comments having replies
  // TODO: https://github.com/hicommonwealth/commonwealth/issues/10459
  // const [highlightedComment, setHighlightedComment] = useState(false);
  // available at start
  // useEffect(() => {
  //   if (comments?.length > 0 && !highlightedComment) {
  //     setHighlightedComment(true);

  //     const commentId = window.location.search.startsWith('?comment=')
  //       ? window.location.search.replace('?comment=', '')
  //       : null;

  //     if (commentId) jumpHighlightComment(Number(commentId));
  //   }
  // }, [comments?.length, highlightedComment]);

  const commentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [expandedComment, setExpandedComment] = useState<number | null>(null);

  const handleScrollToComment = (index: number) => {
    setExpandedComment(index);
  };

  useEffect(() => {
    if (expandedComment !== null && commentRefs.current[expandedComment]) {
      commentRefs.current[expandedComment]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [expandedComment]);

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

  const handleDeleteComment = (comment: CommentViewParams) => {
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
              await deleteComment({ comment_id: comment.id });
            } catch (err) {
              if (err instanceof SessionKeyError) {
                checkForSessionKeyRevalidationErrors(err);
                return;
              }
              console.error(err.message);
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
    comment: CommentViewParams,
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
      setEdits((p) => {
        if (!p) {
          return;
        }

        return {
          ...p,
          [comment.id]: {
            ...(p[comment.id] || {}),
            isEditing: false,
            editDraft: '',
          },
        };
      });
      // @ts-expect-error <StrictNullChecks/>
      setIsGloballyEditing(false);
    }
  };

  const handleEditStart = (comment: CommentViewParams) => {
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
          contentDelta: deserializeDelta(comment.body),
        },
      }));
      // @ts-expect-error <StrictNullChecks/>
      setIsGloballyEditing(true);
    }
  };

  const handleEditConfirm = (
    comment: CommentViewParams,
    newDelta: DeltaStatic,
  ) => {
    const handleAsync = async () => {
      setEdits((p) => ({
        ...p,
        [comment.id]: {
          // @ts-expect-error <StrictNullChecks/>
          ...(p[comment.id] || {}),
          isSavingEdit: true,
        },
      }));

      try {
        const input = await buildUpdateCommentInput({
          commentId: comment.id,
          updatedBody: serializeDelta(newDelta) || comment.body,
          commentMsgId: comment.canvas_msg_id || '',
          communityId,
          profile: {
            userId: user.activeAccount?.profile?.userId || 0,
            address: user.activeAccount?.address || '',
            avatarUrl: user.activeAccount?.profile?.avatarUrl || '',
            name: user.activeAccount?.profile?.name || '',
            lastActive:
              user.activeAccount?.profile?.lastActive?.toString() || '',
          },
        });
        await editComment(input);
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
          checkForSessionKeyRevalidationErrors(err);
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

    handleAsync().catch(console.error);
  };

  const handleFlagMarkAsSpam = (comment: CommentViewParams) => {
    openConfirmation({
      title: !comment.marked_as_spam_at
        ? 'Confirm flag as spam'
        : 'Unflag as spam?',
      description: !comment.marked_as_spam_at ? (
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
          label: !comment.marked_as_spam_at ? 'Confirm' : 'Unflag as spam?',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await toggleCommentSpamStatus({
                communityId,
                commentId: comment.id,
                isSpam: !comment.marked_as_spam_at,
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

  const onFiltersChange = (newFilters: CommentFilters) => {
    setCommentFilters(newFilters);
  };

  return {
    handleIsReplying,
    handleDeleteComment,
    handleEditCancel,
    handleEditStart,
    handleEditConfirm,
    handleFlagMarkAsSpam,
    handleScrollToComment,
    isLocked,
    edits,
    isAdmin,
    commentFilters,
    onFiltersChange,
  };
};
