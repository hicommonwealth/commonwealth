import { ContentType } from '@hicommonwealth/shared';
import { SessionKeyError } from 'controllers/server/sessions';
import { GetThreadActionTooltipTextResponse } from 'helpers/threads';
import { CommentsFeaturedFilterTypes } from 'models/types';
import type { DeltaStatic } from 'quill';
import React, { LegacyRef, useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import app from 'state';
import {
  useDeleteCommentMutation,
  useEditCommentMutation,
  useFetchCommentsQuery,
  useToggleCommentSpamStatusMutation,
} from 'state/api/comments';
import { buildUpdateCommentInput } from 'state/api/comments/editComment';
import { useAuthModalStore } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import { CreateComment } from 'views/components/Comments/CreateComment';
import { Select } from 'views/components/Select';
import { WithActiveStickyComment } from 'views/components/StickEditorContainer/context/WithActiveStickyComment';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import {
  deserializeDelta,
  serializeDelta,
} from 'views/components/react_quill_editor/utils';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { notifyError } from '../../../../controllers/app/notifications';
import Thread from '../../../../models/Thread';
import Permissions from '../../../../utils/Permissions';
import { CommentCard } from '../CommentCard';
import { CommentViewParams } from '../CommentCard/CommentCard';
import { clearEditingLocalStorage } from '../CommentTree/helpers';
import './CommentTree.scss';

type CommentsTreeAttrs = {
  pageRef: React.MutableRefObject<HTMLDivElement | undefined>;
  commentsRef: React.MutableRefObject<HTMLDivElement | undefined>;
  thread: Thread;
  setIsGloballyEditing?: (status: boolean) => void;
  isReplying: boolean;
  setIsReplying: (status: boolean) => void;
  parentCommentId: number;
  setParentCommentId: (id: number) => void;
  fromDiscordBot?: boolean;
  canReact?: boolean;
  canReply?: boolean;
  canComment: boolean;
  disabledActionsTooltipText?: GetThreadActionTooltipTextResponse;
};

export const CommentTree = ({
  pageRef,
  commentsRef,
  thread,
  setIsGloballyEditing,
  // fromDiscordBot, TODO: use this again
  isReplying,
  setIsReplying,
  parentCommentId,
  setParentCommentId,
  canReact = true,
  canReply = true,
  canComment,
  disabledActionsTooltipText,
}: CommentsTreeAttrs) => {
  const urlParams = new URLSearchParams(location.search);
  const focusCommentsParam = urlParams.get('focusComments') === 'true';
  // TODO: add these params to API
  const [includeSpamThreads, setIncludeSpamThreads] = useState<boolean>(false);
  const [commentSortType, setCommentSortType] =
    useState<CommentsFeaturedFilterTypes>(CommentsFeaturedFilterTypes.Newest);

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

  // const [highlightedComment, setHighlightedComment] = useState(false); // TODO: fix this

  const communityId = app.activeChainId() || '';

  const {
    data: paginatedComments,
    fetchNextPage: fetchMoreComments,
    hasNextPage,
    isInitialLoading: isInitialCommentsLoading,
  } = useFetchCommentsQuery({
    thread_id: parseInt(`${thread.id}`) || 0,
    include_reactions: true,
    cursor: 1,
    limit: 10,
    apiEnabled: !!communityId && !!thread.id,
  });
  const allComments = (paginatedComments?.pages || []).flatMap(
    (page) => page.results,
  ) as CommentViewParams[];
  console.log('allComments => ', allComments);

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

  const isAdminOrMod =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin() ||
    Permissions.isCommunityModerator();

  const isLocked = !!(thread instanceof Thread && thread.readOnly);

  // TODO: figure out a way to focus comments from url since with pagination we wont have all the comments
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

  // const commentsList = usePrepareCommentsList({
  //   levelZeroComments: comments,
  //   allComments,
  //   threadId: thread.id,
  //   includeSpams,
  //   commentSortType,
  //   isLocked,
  //   // @ts-expect-error <StrictNullChecks/>
  //   fromDiscordBot,
  //   isLoggedIn: user.isLoggedIn,
  // });

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

  const handleEditConfirm = async (
    comment: CommentViewParams,
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
          lastActive: user.activeAccount?.profile?.lastActive?.toString() || '',
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

  if (allComments.length === 0) return <></>;

  return (
    <>
      <div
        className="comments-filter-row"
        ref={commentsRef as LegacyRef<HTMLDivElement>}
      >
        <Select
          key={commentSortType}
          size="compact"
          selected={commentSortType}
          onSelect={(item: any) => {
            setCommentSortType(item.value);
          }}
          options={[
            {
              id: 1,
              value: CommentsFeaturedFilterTypes.Newest,
              label: 'Newest',
              iconLeft: 'sparkle',
            },
            {
              id: 2,
              value: CommentsFeaturedFilterTypes.Oldest,
              label: 'Oldest',
              iconLeft: 'clockCounterClockwise',
            },
          ]}
        />
        <CWCheckbox
          checked={includeSpamThreads}
          label="Include comments flagged as spam"
          onChange={(e) => setIncludeSpamThreads(e?.target?.checked || false)}
        />
      </div>
      <div className="CommentsTree">
        <Virtuoso
          className="comments-list"
          style={{ height: '100%', width: '100%' }}
          data={isInitialCommentsLoading ? [] : allComments}
          customScrollParent={pageRef.current}
          itemContent={(index, comment) => {
            const isCommentAuthor =
              comment.address === user.activeAccount?.address;

            return (
              <div
                key={comment.id + '' + comment.marked_as_spam_at}
                ref={(el) => {
                  commentRefs.current[index] = el;
                }}
              >
                <div className={`Comment comment-${comment.id}`}>
                  {/* TODO: fix nested comments + their pagination */}
                  {/* {comment.threadLevel > 0 && (
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
                              smaller: i >= nextCommentThreadLevel || !nextComment,
                            })}
                          />
                        ))}
                    </div>
                  )} */}
                  <CommentCard
                    key={`${comment.id}-${comment.body}`}
                    disabledActionsTooltipText={disabledActionsTooltipText}
                    isThreadArchived={!!thread.archivedAt}
                    canReply={
                      !!user.activeAccount &&
                      !thread.archivedAt &&
                      !thread.lockedAt &&
                      canReply
                    }
                    maxReplyLimitReached={false}
                    // maxReplyLimitReached={comment.maxReplyLimitReached} // TODO: get this from somewhere
                    canReact={
                      !thread.archivedAt &&
                      (!!user.activeAccount || isAdmin) &&
                      canReact
                    }
                    canEdit={!isLocked && (isCommentAuthor || isAdminOrMod)}
                    editDraft={edits?.[comment.id]?.editDraft || ''}
                    onEditStart={() => handleEditStart(comment)}
                    onEditCancel={(hasContentChanged: boolean) =>
                      handleEditCancel(comment, hasContentChanged)
                    }
                    onEditConfirm={async (newDelta) =>
                      await handleEditConfirm(comment, newDelta)
                    }
                    isSavingEdit={edits?.[comment.id]?.isSavingEdit || false}
                    isEditing={edits?.[comment.id]?.isEditing || false}
                    canDelete={!isLocked && (isCommentAuthor || isAdminOrMod)}
                    replyBtnVisible={true}
                    // replyBtnVisible={comment.replyBtnVisible} TODO: get this from somewhere
                    onReply={() => {
                      setParentCommentId(comment.id);
                      setIsReplying(true);
                      handleScrollToComment(index);
                    }}
                    onDelete={() => handleDeleteComment(comment)}
                    isSpam={!!comment.marked_as_spam_at}
                    onSpamToggle={() => handleFlagMarkAsSpam(comment)}
                    canToggleSpam={
                      !isLocked && (isCommentAuthor || isAdminOrMod)
                    }
                    comment={comment}
                    shareURL={`${window.location.origin}${window.location.pathname}?comment=${comment.id}`}
                  />
                </div>
                {isReplying && parentCommentId === comment.id && (
                  <WithActiveStickyComment>
                    <CreateComment
                      handleIsReplying={handleIsReplying}
                      parentCommentId={parentCommentId}
                      rootThread={thread}
                      canComment={canComment}
                      isReplying={isReplying}
                      replyingToAuthor={comment.profile_name}
                      onCancel={() => {
                        handleEditCancel(comment, false);
                      }}
                      tooltipText={
                        !canComment &&
                        typeof disabledActionsTooltipText === 'string'
                          ? disabledActionsTooltipText
                          : ''
                      }
                    />
                  </WithActiveStickyComment>
                )}
              </div>
            );
          }}
          endReached={() => {
            hasNextPage && fetchMoreComments();
          }}
          overscan={50}
          components={{
            // eslint-disable-next-line react/no-multi-comp
            EmptyPlaceholder: () => <></>,
          }}
        />
      </div>
    </>
  );
};
