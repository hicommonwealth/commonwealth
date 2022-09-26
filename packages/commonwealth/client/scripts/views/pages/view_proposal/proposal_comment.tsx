/* @jsx m */

import m from 'mithril';
import { PopoverMenu } from 'construct-ui';

import 'pages/view_proposal/index.scss';

import app from 'state';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { CommentParent } from 'controllers/server/comments';
import { Thread, Comment, AnyProposal } from 'models';
import { SocialSharingCarat } from 'views/components/social_sharing_carat';
import {
  ProposalBodyAvatar,
  ProposalBodyAuthor,
  ProposalBodyCreated,
  ProposalBodyLastEdited,
  ProposalBodyCancelEdit,
  ProposalBodySaveEdit,
  ProposalBodyText,
  ProposalBodyAttachments,
  ProposalBodyEditor,
  ProposalBodyEditMenuItem,
  ProposalBodyDeleteMenuItem,
} from './body';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { InlineReplyButton } from '../../components/inline_reply_button';
import { CommentReactionButton } from '../../components/reaction_button/comment_reaction_button';
import { QuillEditor } from '../../components/quill/quill_editor';
import { GlobalStatus, ProposalPageState } from './types';
import { scrollToForm } from './helpers';

export class ProposalComment
  implements
    m.ClassComponent<{
      comment: Comment<any>;
      getSetGlobalEditingStatus: CallableFunction;
      proposalPageState: ProposalPageState;
      parent: AnyProposal | Comment<any> | Thread;
      proposal: AnyProposal | Thread;
      callback?: CallableFunction;
      isAdmin?: boolean;
      isLast: boolean;
    }>
{
  private editing: boolean;
  private quillEditorState: QuillEditor;
  private replying: boolean;
  private saving: boolean;

  view(vnode) {
    const {
      comment,
      getSetGlobalEditingStatus,
      proposalPageState,
      proposal,
      callback,
      isAdmin,
      isLast,
    } = vnode.attrs;

    if (!comment) return;
    const parentType = comment.parentComment
      ? CommentParent.Comment
      : CommentParent.Proposal;

    const commentLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}?comment=${comment.id}`
    );

    const commentReplyCount = app.comments
      .getByProposal(proposal)
      .filter((c) => c.parentComment === comment.id && !c.deleted).length;

    return m(
      '.ProposalComment',
      {
        class: `${parentType}-child comment-${comment.id}`,
        onchange: () => m.redraw(), // TODO: avoid catching bubbled input events
      },
      [
        (!isLast || app.user.activeAccount) && m('.thread-connector'),
        m('.comment-avatar', [m(ProposalBodyAvatar, { item: comment })]),
        m('.comment-body', [
          m('.comment-body-top', [
            m(ProposalBodyAuthor, { item: comment }),
            m(ProposalBodyCreated, { item: comment, link: commentLink }),
            m(ProposalBodyLastEdited, { item: comment }),

            ((!this.editing &&
              app.user.activeAccount &&
              !getSetGlobalEditingStatus(GlobalStatus.Get) &&
              app.user.activeAccount?.chain.id === comment.authorChain &&
              app.user.activeAccount?.address === comment.author) ||
              isAdmin) && [
              m(PopoverMenu, {
                closeOnContentClick: true,
                content: [
                  app.user.activeAccount?.address === comment.author &&
                    m(ProposalBodyEditMenuItem, {
                      item: comment,
                      proposalPageState,
                      getSetGlobalEditingStatus,
                      parentState: this,
                    }),
                  m(ProposalBodyDeleteMenuItem, {
                    item: comment,
                    refresh: () => callback(),
                  }),
                ],
                transitionDuration: 0,
                trigger: m('', [
                  m(CWIcon, {
                    iconName: 'chevronDown',
                    iconSize: 'small',
                  }),
                ]),
              }),
            ],
            m(SocialSharingCarat, { commentID: comment.id }),

            // For now, we are limiting threading to 1 level deep
            // Comments whose parents are other comments should not display the reply option
            // !this.editing
            //   && app.user.activeAccount
            //   && !getSetGlobalEditingStatus(GlobalStatus.Get)
            //   && parentType === CommentParent.Proposal
            //   && [
            //     m(ProposalBodyReply, {
            //       item: comment,
            //       getSetGlobalReplyStatus,
            //       parentType,
            //       parentState: this,
            //     }),
            //   ],
          ]),
          m('.comment-body-content', [
            !this.editing && m(ProposalBodyText, { item: comment }),

            !this.editing &&
              comment.attachments &&
              comment.attachments.length > 0 &&
              m(ProposalBodyAttachments, { item: comment }),

            this.editing &&
              m(ProposalBodyEditor, {
                item: comment,
                parentState: this,
              }),
          ]),
          m('.comment-body-bottom', [
            this.editing &&
              m('.comment-edit-buttons', [
                m(ProposalBodySaveEdit, {
                  item: comment,
                  getSetGlobalEditingStatus,
                  parentState: this,
                  callback,
                }),
                m(ProposalBodyCancelEdit, {
                  item: comment,
                  getSetGlobalEditingStatus,
                  parentState: this,
                }),
              ]),
            !this.editing &&
              !comment.deleted &&
              m('.comment-response-row', [
                m(CommentReactionButton, {
                  comment,
                }),
                m(InlineReplyButton, {
                  commentReplyCount,
                  onclick: () => {
                    if (
                      !proposalPageState.replying ||
                      proposalPageState.parentCommentId !== comment.id
                    ) {
                      proposalPageState.replying = true;
                      proposalPageState.parentCommentId = comment.id;
                      scrollToForm(comment.id);
                    } else {
                      proposalPageState.replying = false;
                    }
                  },
                }),
              ]),
          ]),
        ]),
      ]
    );
  }
}
