/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/index.scss';

import app from 'state';
import { Thread, Comment, AnyProposal } from 'models';
import { CreateComment } from './create_comment';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { jumpHighlightComment } from './helpers';
import { GlobalStatus, ProposalPageState } from './types';
import { MAX_THREAD_LEVEL } from './constants';
import { ProposalComment } from './proposal_comment';

export class ProposalComments
  implements
    m.ClassComponent<{
      proposal: Thread | AnyProposal;
      comments: Array<Comment<any>>;
      createdCommentCallback: CallableFunction;
      getSetGlobalEditingStatus: CallableFunction;
      proposalPageState: ProposalPageState;
      user?: any;
      recentlySubmitted?: number;
      isAdmin: boolean;
    }>
{
  commentError: any;
  dom;
  highlightedComment: boolean;

  view(vnode) {
    const {
      proposal,
      comments,
      createdCommentCallback,
      getSetGlobalEditingStatus,
      proposalPageState,
      isAdmin,
    } = vnode.attrs;
    // Jump to the comment indicated in the URL upon page load. Avoid
    // using m.route.param('comment') because it may return stale
    // results from a previous page if route transition hasn't finished
    if (
      vnode.state.dom &&
      comments?.length > 0 &&
      !vnode.state.highlightedComment
    ) {
      vnode.state.highlightedComment = true;
      const commentId = window.location.search.startsWith('?comment=')
        ? window.location.search.replace('?comment=', '')
        : null;
      if (commentId) jumpHighlightComment(commentId);
    }

    const nestedReplyForm = (comment) => {
      // if current comment is replyParent, & no posts are being edited, a nested comment form is rendered
      if (
        !proposalPageState.editing &&
        proposalPageState.parentCommentId === comment.id &&
        !getSetGlobalEditingStatus(GlobalStatus.Get)
      ) {
        return m(CreateComment, {
          callback: createdCommentCallback,
          cancellable: true,
          getSetGlobalEditingStatus,
          proposalPageState,
          parentComment: comment,
          rootProposal: proposal,
        });
      }
    };

    const isLivingCommentTree = (comment, children) => {
      if (!comment.deleted) return true;
      else if (!children.length) return false;
      else {
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
      parent: AnyProposal | Thread | Comment<any>,
      threadLevel: number
    ) => {
      const canContinueThreading = threadLevel <= MAX_THREAD_LEVEL;
      return comments_.map((comment: Comment<any>, idx) => {
        if (!comment) return;
        const children = app.comments
          .getByProposal(proposal)
          .filter((c) => c.parentComment === comment.id);
        if (isLivingCommentTree(comment, children)) {
          return m(
            `.threading-level-${threadLevel}`,
            {
              style: `margin-left: 32px`,
            },
            [
              m(ProposalComment, {
                comment,
                getSetGlobalEditingStatus,
                proposalPageState,
                parent,
                proposal,
                callback: createdCommentCallback,
                isAdmin,
                isLast: idx === comments_.length - 1,
              }),
              !!children.length &&
                canContinueThreading &&
                recursivelyGatherComments(children, comment, threadLevel + 1),
              canContinueThreading && nestedReplyForm(comment),
            ]
          );
        }
      });
    };

    return m(
      '.ProposalComments',
      {
        oncreate: (vvnode) => {
          vnode.state.dom = vvnode.dom;
        },
      },
      [
        // show comments
        comments &&
          m(
            '.proposal-comments',
            recursivelyGatherComments(comments, proposal, 0)
          ),
        // create comment
        // errors
        vnode.state.commentError &&
          m(CWValidationText, {
            message: vnode.state.commentError,
            status: 'failure',
          }),
      ]
    );
  }
}
