import { commentsByDate } from 'helpers/dates';
import type { IUniqueId } from 'models/interfaces';
import { CommentsFeaturedFilterTypes } from 'models/types';
import app from 'state';
import type { Comment as CommentType } from '../../../../models/Comment';

const MAX_THREAD_LEVEL = 8;

type ExtendedComment = {
  threadLevel: number;
  isCommentAuthor: boolean;
  maxReplyLimitReached: boolean;
  replyBtnVisible: boolean;
  children: Array<CommentType<IUniqueId> & ExtendedComment>;
};

interface UsePrepareCommentsListProps {
  levelZeroComments: Array<CommentType<any>>;
  allComments: Array<CommentType<any>>;
  threadId: number;
  includeSpams: boolean;
  commentSortType: CommentsFeaturedFilterTypes;
  isLocked: boolean;
  fromDiscordBot: boolean;
  isLoggedIn: boolean;
}

// This hook in multiple steps takes the zero level comments and then create nested
// structure of comments and replies, and then eventually creates and returns
// flattened list of comments & replies that is ready to be rendered in this exact order.
const usePrepareCommentsList = ({
  levelZeroComments,
  allComments,
  threadId,
  includeSpams,
  commentSortType,
  isLocked,
  fromDiscordBot,
  isLoggedIn,
}: UsePrepareCommentsListProps) => {
  const isLivingCommentTree = (
    comment: CommentType<any>,
    children: Array<CommentType<any>>,
  ) => {
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
          (c) => c.threadId === threadId && c.parentComment === comment.id,
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

  // This functions creates recursively a tree of zero level comments and their nested children (replies)
  const recursivelyGatherComments = (
    _levelZeroComments: Array<CommentType<any>>,
    threadLevel: number,
  ): Array<CommentType<any> & ExtendedComment> => {
    const canContinueThreading = threadLevel <= MAX_THREAD_LEVEL;

    return (
      _levelZeroComments
        // exclude comments that are marked as spam
        .filter((c) => (includeSpams ? true : !c.markedAsSpamAt))
        // each zero level comment has children property with all nested comments
        // apart from that, some more properties defined in ExtendedComment type
        // that are necessary for proper rendering of each comment
        .reduce((acc, comment: CommentType<any>) => {
          const children = allComments
            // take only comments that are direct children of current comment
            .filter(
              (c) => c.threadId === threadId && c.parentComment === comment.id,
            )
            // sorts comments and nested comments according to user selection from dropdown
            .sort((a, b) => commentsByDate(a, b, commentSortType));

          // if user deletes some comments, the comments tree below might not be living anymore
          if (isLivingCommentTree(comment, children)) {
            const maxReplyLimitReached = threadLevel >= MAX_THREAD_LEVEL;
            const isCommentAuthor =
              comment.author === app.user.activeAccount?.address;
            const replyBtnVisible = !!(
              !isLocked &&
              !fromDiscordBot &&
              isLoggedIn
            );

            return [
              ...acc,
              {
                ...comment,
                threadLevel,
                isCommentAuthor,
                maxReplyLimitReached,
                replyBtnVisible,
                children:
                  children?.length && canContinueThreading
                    ? recursivelyGatherComments(children, threadLevel + 1)
                    : [],
              },
            ];
          } else {
            return [...acc];
          }
        }, [])
    );
  };

  // This functions transforms nested list of comments created by "recursivelyGatherComments"
  // into flat list which is exactly in the order how user would see this in the UI
  const getFlattenComments = (
    _comments: Array<CommentType<IUniqueId> & ExtendedComment>,
  ) => {
    const flattenedComments: Array<CommentType<IUniqueId> & ExtendedComment> =
      [];

    const flatten = (comment: CommentType<IUniqueId> & ExtendedComment) => {
      flattenedComments.push(comment);

      if (comment.children && comment.children.length > 0) {
        comment.children.forEach(flatten);
      }
    };

    _comments.forEach(flatten);

    return flattenedComments;
  };

  const nestedCommentsList = levelZeroComments
    ? recursivelyGatherComments(levelZeroComments, 0)
    : [];

  return getFlattenComments(nestedCommentsList);
};

export default usePrepareCommentsList;
