/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/view_proposal/proposal_comment.scss';

import app from 'state';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { Thread, Comment, AnyProposal } from 'models';
import { SocialSharingCarat } from 'views/components/social_sharing_carat';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { InlineReplyButton } from '../../components/inline_reply_button';
import { CommentReactionButton } from '../../components/reaction_button/comment_reaction_button';
import { QuillEditor } from '../../components/quill/quill_editor';
import { ProposalPageState } from './types';
import { scrollToForm } from './helpers';
import {
  ProposalBodyAuthor,
  ProposalBodyCreated,
  ProposalBodyLastEdited,
  ProposalBodyEditMenuItem,
  ProposalBodyDeleteMenuItem,
} from './proposal_header_components';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWButton } from '../../components/component_kit/cw_button';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { EditComment } from './edit_comment';

type ProposalCommentAttrs = {
  callback?: CallableFunction;
  comment: Comment<any>;
  setIsGloballyEditing: (status: boolean) => void;
  isAdmin?: boolean;
  isLast: boolean;
  parent: AnyProposal | Comment<any> | Thread;
  proposal: AnyProposal | Thread;
  proposalPageState: ProposalPageState;
  threadLevel: number;
};

export class ProposalComment implements m.ClassComponent<ProposalCommentAttrs> {
  private editing: boolean;
  private quillEditorState: QuillEditor;
  private replying: boolean;
  private saving: boolean;

  view(vnode) {
    const {
      callback,
      comment,
      setIsGloballyEditing,
      isAdmin,
      isLast,
      proposal,
      proposalPageState,
      threadLevel,
    } = vnode.attrs;

    // const commentLink = getProposalUrlPath(
    //   proposal.slug,
    //   `${proposal.identifier}-${slugify(proposal.title)}?comment=${comment.id}`
    // );

    return (
      <div class="ProposalComment">
        {threadLevel > 0 && (
          <div class="thread-connectors-container">
            {Array(threadLevel)
              .fill(undefined)
              .map(() => (
                <div class="thread-connector" />
              ))}
          </div>
        )}
        <div class="comment-body">
          <div class="comment-header">
            <ProposalBodyAuthor item={comment} />
            <CWText type="caption" className="published-text">
              published on
            </CWText>
            <CWText
              type="caption"
              fontWeight="medium"
              className="published-text"
            >
              {moment(comment.createdAt).format('l')}
            </CWText>
          </div>
          {this.editing ? (
            <EditComment
              callback={callback}
              comment={comment}
              setIsGloballyEditing={setIsGloballyEditing}
              proposalPageState={proposalPageState}
            />
          ) : (
            <>
              <CWText type="b2">{renderQuillTextBody(comment.text)}</CWText>
              <div class="comment-footer">
                <div class="menu-buttons-left">
                  <div class="vote-group">
                    <CWIconButton iconName="upvote" iconSize="small" />
                    <CWText type="caption" className="menu-buttons-text">
                      30
                    </CWText>
                    <CWIconButton iconName="downvote" iconSize="small" />
                  </div>
                  <div class="reply-button" onclick={() => console.log()}>
                    <CWIcon iconName="feedback" iconSize="small" />
                    <CWText type="caption" className="menu-buttons-text">
                      Reply
                    </CWText>
                  </div>
                </div>
                <div class="menu-buttons-right">
                  <CWIconButton iconName="share" iconSize="small" />
                  <CWIconButton iconName="flag" iconSize="small" />
                  <CWIconButton iconName="bell" iconSize="small" />
                  <CWPopoverMenu
                    trigger={
                      <CWIconButton iconName="dotsVertical" iconSize="small" />
                    }
                    popoverMenuItems={[
                      {
                        label: 'Edit',
                        iconName: 'edit',
                        onclick: () => {
                          this.editing = true;
                        },
                      },
                      { label: 'Delete', iconName: 'trash' },
                    ]}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}
