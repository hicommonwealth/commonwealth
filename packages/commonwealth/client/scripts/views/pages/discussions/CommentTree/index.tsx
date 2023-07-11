import useUserLoggedIn from 'hooks/useUserLoggedIn';
import type { DeltaStatic } from 'quill';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { ContentType } from 'types';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { notifyError } from '../../../../controllers/app/notifications';
import type { Comment as CommentType } from '../../../../models/Comment';
import Thread from '../../../../models/Thread';
import Permissions from '../../../../utils/Permissions';
import { CreateComment } from '../../../components/Comments/CreateComment';
import { CWValidationText } from '../../../components/component_kit/cw_validation_text';
import {
  deserializeDelta,
  serializeDelta,
} from '../../../components/react_quill_editor/utils';
import { CommentCard } from '../CommentCard';
import { clearEditingLocalStorage } from '../CommentTree/helpers';
import { jumpHighlightComment } from './helpers';
import './index.scss';

const MAX_THREAD_LEVEL = 8;

type CommentsTreeAttrs = {
  comments: Array<CommentType<any>>;
  thread: Thread;
  setIsGloballyEditing?: (status: boolean) => void;
  updatedCommentsCallback: () => void;
  includeSpams: boolean;
  isReplying: boolean;
  setIsReplying: (status: boolean) => void;
  parentCommentId: number;
  setParentCommentId: (id: number) => void;
};

export const CommentsTree = ({
  comments,
  thread,
  setIsGloballyEditing,
  updatedCommentsCallback,
  includeSpams,
  isReplying,
  setIsReplying,
  parentCommentId,
  setParentCommentId,
}: CommentsTreeAttrs) => {
  const [commentError] = useState(null);
  const [highlightedComment, setHighlightedComment] = useState(false);

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

        const grandchildren = app.comments
          .getByThread(thread)
          .filter((c) => c.parentComment === child.id);

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
          buttonType: 'mini-red',
          onClick: async () => {
            try {
              await app.comments.delete(comment, thread.id);
              updatedCommentsCallback();
            } catch (e) {
              console.log(e);
              notifyError('Failed to delete comment.');
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'mini-black',
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
            buttonType: 'mini-black',
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
            buttonType: 'mini-white',
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
            buttonType: 'mini-black',
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
            buttonType: 'mini-white',
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
        await app.comments.edit(comment, serializeDelta(newDelta));
        setEdits((p) => ({
          ...p,
          [comment.id]: {
            ...(p[comment.id] || {}),
            isEditing: false,
          },
        }));
        setIsGloballyEditing(false);
        clearEditingLocalStorage(comment.id, ContentType.Comment);
        updatedCommentsCallback();
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
          buttonType: 'mini-black',
        },
        {
          label: !comment.markedAsSpamAt ? 'Confirm' : 'Unflag as spam?',
          buttonType: 'mini-red',
          onClick: async () => {
            try {
              app.comments
                .toggleSpam(comment.id, !!comment.markedAsSpamAt)
                .then(() => {
                  updatedCommentsCallback && updatedCommentsCallback();
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
        const children = app.comments
          .getByThread(thread)
          .filter((c) => c.parentComment === comment.id);

        if (isLivingCommentTree(comment, children)) {
          const isCommentAuthor =
            comment.author === app.user.activeAccount?.address;

          const isLast = threadLevel === 8;

          const canReply = !!(
            !isLast &&
            !isLocked &&
            isLoggedIn &&
            app.user.activeAccount
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
                  threadArchivedAt={thread.archivedAt}
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
                  canReply={canReply}
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
                  updatedCommentsCallback={updatedCommentsCallback}
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
