/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/comments/comments_tree.scss';
import type { AnyProposal, Comment as CommentType } from 'models';
import { Thread } from 'models';

import app from 'state';
import { CWValidationText } from '../component_kit/cw_validation_text';
import { Comment } from './comment';
import { CreateComment } from './create_comment';
import { jumpHighlightComment } from './helpers';

const MAX_THREAD_LEVEL = 2;

type CommentsTreeAttrs = {
  comments: Array<CommentType<any>>;
  proposal: Thread | AnyProposal;
  setIsGloballyEditing?: (status: boolean) => void;
  updatedCommentsCallback: () => void;
};

export class CommentsTree extends ClassComponent<CommentsTreeAttrs> {
  private commentError: any;
  private dom;
  private highlightedComment: boolean;
  private isReplying: boolean;
  private parentCommentId: number;

  oncreate(vnode: ResultNode<CommentsTreeAttrs>) {
    this.dom = vnode.dom;
  }

  view(vnode: ResultNode<CommentsTreeAttrs>) {
    const {
      comments,
      proposal,
      setIsGloballyEditing,
      updatedCommentsCallback,
    } = vnode.attrs;

    // Jump to the comment indicated in the URL upon page load. Avoid
    // using getRouteParam('comment') because it may return stale
    // results from a previous page if route transition hasn't finished

    if (this.dom && comments?.length > 0 && !this.highlightedComment) {
      this.highlightedComment = true;

      const commentId = window.location.search.startsWith('?comment=')
        ? window.location.search.replace('?comment=', '')
        : null;

      if (commentId) jumpHighlightComment(Number(commentId));
    }

    const handleIsReplying = (isReplying: boolean, id?: number) => {
      if (isReplying) {
        this.parentCommentId = id;
        this.isReplying = true;
      } else {
        this.parentCommentId = undefined;
        this.isReplying = false;
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
            .getByProposal(proposal)
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
          .getByProposal(proposal)
          .filter((c) => c.parentComment === comment.id);

        if (isLivingCommentTree(comment, children)) {
          return (
            <React.Fragment key={comment.id}>
              <Comment
                comment={comment}
                handleIsReplying={handleIsReplying}
                isLast={threadLevel === 2}
                isLocked={proposal instanceof Thread && proposal.readOnly}
                setIsGloballyEditing={setIsGloballyEditing}
                threadLevel={threadLevel}
                updatedCommentsCallback={updatedCommentsCallback}
              />
              {!!children.length &&
                canContinueThreading &&
                recursivelyGatherComments(children, comment, threadLevel + 1)}
              {this.isReplying && this.parentCommentId === comment.id && (
                <CreateComment
                  handleIsReplying={handleIsReplying}
                  parentCommentId={this.parentCommentId}
                  rootProposal={proposal}
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
        {recursivelyGatherComments(comments, comments[0], 0)}
        {this.commentError && (
          <CWValidationText message={this.commentError} status="failure" />
        )}
      </div>
    );
  }
}
