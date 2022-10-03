/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/proposal_comments.scss';

import app from 'state';
import { Thread, Comment, AnyProposal } from 'models';
import { CreateComment } from './create_comment';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { jumpHighlightComment } from './helpers';
import { MAX_THREAD_LEVEL } from './constants';
import { ProposalComment } from './proposal_comment';

type ProposalCommentsAttrs = {
  comments: Array<Comment<any>>;
  proposal: Thread | AnyProposal;
  setIsGloballyEditing: (status: boolean) => void;
  updatedCommentsCallback: () => void;
};

export class ProposalComments
  implements m.ClassComponent<ProposalCommentsAttrs>
{
  private commentError: any;
  private dom;
  private highlightedComment: boolean;
  private isReplying: boolean;
  private parentCommentId: number;

  oncreate(vvnode) {
    this.dom = vvnode.dom;
  }

  view(vnode) {
    const {
      comments,
      proposal,
      setIsGloballyEditing,
      updatedCommentsCallback,
    } = vnode.attrs;

    // Jump to the comment indicated in the URL upon page load. Avoid
    // using m.route.param('comment') because it may return stale
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
      comments_: Comment<any>[],
      parentComment: Comment<any>,
      threadLevel: number
    ) => {
      const canContinueThreading = threadLevel <= MAX_THREAD_LEVEL;

      return comments_.map((comment: Comment<any>) => {
        const children = app.comments
          .getByProposal(proposal)
          .filter((c) => c.parentComment === comment.id);

        if (isLivingCommentTree(comment, children)) {
          return (
            <>
              <ProposalComment
                comment={comment}
                handleIsReplying={handleIsReplying}
                isLast={threadLevel === 2}
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
            </>
          );
        } else {
          return null;
        }
      });
    };

    return (
      <div class="ProposalComments">
        {recursivelyGatherComments(comments, proposal, 0)}
        {this.commentError && (
          <CWValidationText message={this.commentError} status="failure" />
        )}
      </div>
    );
  }
}
