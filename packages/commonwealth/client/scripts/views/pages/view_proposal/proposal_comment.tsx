/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/view_proposal/proposal_comment.scss';

import app from 'state';
// import { getProposalUrlPath } from 'identifiers';
// import { slugify } from 'utils';
import { Comment } from 'models';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { ProposalBodyAuthor } from './proposal_components';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { EditComment } from './edit_comment';
import { scrollToForm } from './helpers';

type ProposalCommentAttrs = {
  comment: Comment<any>;
  handleIsReplying: (isReplying: boolean, id?: number) => void;
  isGloballyEditing: boolean;
  isLast: boolean;
  setIsGloballyEditing: (status: boolean) => void;
  threadLevel: number;
  updatedCommentsCallback?: () => void;
};

export class ProposalComment implements m.ClassComponent<ProposalCommentAttrs> {
  private isEditingComment: boolean;

  view(vnode) {
    const {
      comment,
      handleIsReplying,
      isLast,
      setIsGloballyEditing,
      threadLevel,
      updatedCommentsCallback,
    } = vnode.attrs;

    const setIsEditingComment = (status: boolean) => {
      setIsGloballyEditing(status);
      this.isEditingComment = status;
    };

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
          {this.isEditingComment ? (
            <EditComment
              comment={comment}
              setIsEditing={setIsEditingComment}
              updatedCommentsCallback={updatedCommentsCallback}
            />
          ) : (
            <>
              <CWText type="b2">{renderQuillTextBody(comment.text)}</CWText>
              {!comment.deleted && (
                <div class="comment-footer">
                  <div class="menu-buttons-left">
                    <div class="vote-group">
                      <CWIconButton iconName="upvote" iconSize="small" />
                      <CWText type="caption" className="menu-buttons-text">
                        30
                      </CWText>
                      <CWIconButton iconName="downvote" iconSize="small" />
                    </div>
                    {!isLast && (
                      <div
                        class="reply-button"
                        onclick={() => {
                          // scrollToForm(comment.id);
                          handleIsReplying(true, comment.id);
                        }}
                      >
                        <CWIcon iconName="feedback" iconSize="small" />
                        <CWText type="caption" className="menu-buttons-text">
                          Reply
                        </CWText>
                      </div>
                    )}
                  </div>
                  <div class="menu-buttons-right">
                    <CWIconButton iconName="share" iconSize="small" />
                    <CWPopoverMenu
                      trigger={
                        <CWIconButton
                          iconName="dotsVertical"
                          iconSize="small"
                        />
                      }
                      popoverMenuItems={[
                        {
                          label: 'Edit',
                          iconName: 'edit',
                          onclick: () => {
                            setIsEditingComment(true);
                          },
                        },
                        {
                          label: 'Delete',
                          iconName: 'trash',
                          onclick: () => {
                            app.comments.delete(comment).then(() => {
                              m.redraw();
                            });
                          },
                        },
                      ]}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
}
