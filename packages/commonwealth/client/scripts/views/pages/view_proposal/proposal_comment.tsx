/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/view_proposal/proposal_comment.scss';

// import app from 'state';
// import { getProposalUrlPath } from 'identifiers';
// import { slugify } from 'utils';
import { Thread, Comment, AnyProposal } from 'models';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { QuillEditor } from '../../components/quill/quill_editor';
import { ProposalPageState } from './types';
import { ProposalBodyAuthor } from './proposal_header_components';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { EditComment } from './edit_comment';

type ProposalCommentAttrs = {
  callback?: CallableFunction;
  comment: Comment<any>;
  isAdmin?: boolean;
  isGloballyEditing: boolean;
  isLast: boolean;
  parent: AnyProposal | Comment<any> | Thread;
  proposal: AnyProposal | Thread;
  proposalPageState: ProposalPageState;
  setIsGloballyEditing: (status: boolean) => void;
  threadLevel: number;
};

export class ProposalComment implements m.ClassComponent<ProposalCommentAttrs> {
  private quillEditorState: QuillEditor;
  private replying: boolean;
  private saving: boolean;

  view(vnode) {
    const {
      callback,
      comment,
      isAdmin,
      isGloballyEditing,
      isLast,
      proposal,
      proposalPageState,
      setIsGloballyEditing,
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
          {isGloballyEditing ? (
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
                          setIsGloballyEditing(true);
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
