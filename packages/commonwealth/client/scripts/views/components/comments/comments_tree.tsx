import React from 'react';

import 'components/comments/comments_tree.scss';

import type { Comment as CommentType } from '../../../models/Comment';
import Thread from '../../../models/Thread';

import app from 'state';
import { CWValidationText } from '../component_kit/cw_validation_text';
import { CommentComponent } from './commentComponent';
import { CreateComment } from './create_comment';
import { jumpHighlightComment } from './helpers';

const MAX_THREAD_LEVEL = 2;

type CommentsTreeAttrs = {
  comments: Array<CommentType<any>>;
  thread: Thread;
  setIsGloballyEditing?: (status: boolean) => void;
  updatedCommentsCallback: () => void;
};

export const CommentsTree = (props: CommentsTreeAttrs) => {
  const [commentError] = React.useState(null);
  const [highlightedComment, setHighlightedComment] = React.useState(false);
  const [isReplying, setIsReplying] = React.useState(false);
  const [parentCommentId, setParentCommentId] = React.useState(null);

  const {
    comments,
    thread,
    setIsGloballyEditing,
    updatedCommentsCallback,
  } = props;

  React.useEffect(() => {
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

  const recursivelyGatherComments = (
    comments_: CommentType<any>[],
    parentComment: CommentType<any>,
    threadLevel: number
  ) => {
    const canContinueThreading = threadLevel <= MAX_THREAD_LEVEL;

    return comments_.map((comment: CommentType<any>) => {
      const children = app.comments
        .getByThread(thread)
        .filter((c) => c.parentComment === comment.id);

      if (isLivingCommentTree(comment, children)) {
        return (
          <React.Fragment key={comment.id}>
            <CommentComponent
              comment={comment}
              handleIsReplying={handleIsReplying}
              isLast={threadLevel === 2}
              isLocked={thread instanceof Thread && thread.readOnly}
              setIsGloballyEditing={setIsGloballyEditing}
              threadLevel={threadLevel}
              threadId={thread.id}
              updatedCommentsCallback={updatedCommentsCallback}
            />
            {!!children.length &&
              canContinueThreading &&
              recursivelyGatherComments(children, comment, threadLevel + 1)}
            {isReplying && parentCommentId === comment.id && (
              <CreateComment
                handleIsReplying={handleIsReplying}
                parentCommentId={parentCommentId}
                rootThread={thread}
                updatedCommentsCallback={updatedCommentsCallback}
              />
            )}
          </React.Fragment>
        );
      } else {
        return null;
      }
    });
  };

  return (
    <div className="ProposalComments">
      {comments && recursivelyGatherComments(comments, comments[0], 0)}
      {commentError && (
        <CWValidationText message={commentError} status="failure" />
      )}
    </div>
  );
};
