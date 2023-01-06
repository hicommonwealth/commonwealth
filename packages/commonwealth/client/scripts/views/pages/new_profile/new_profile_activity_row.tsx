/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import ClassComponent from 'class_component';

import 'pages/new_profile/new_profile_activity_row.scss';

import { link } from 'helpers';
import Thread from 'client/scripts/models/Thread';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTag } from '../../components/component_kit/cw_tag';
import { SharePopover } from '../../components/share_popover';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { CommentWithAssociatedThread } from './new_profile_activity';

type NewProfileActivityRowAttrs = {
  activity: CommentWithAssociatedThread | Thread;
  address: string;
};

export class NewProfileActivityRow extends ClassComponent<NewProfileActivityRowAttrs> {
  view(vnode: m.Vnode<NewProfileActivityRowAttrs>) {
    const { activity } = vnode.attrs;
    const { chain, createdAt, author, title, id, body } = activity;
    const isThread = !!(activity as Thread).kind;
    const comment = activity as CommentWithAssociatedThread;

    return (
      <div className="ProfileActivityRow">
        <div className="chain-info">
          <CWText fontWeight="semiBold">{chain}</CWText>
          <div className="dot">.</div>
          <CWTag label={author.slice(0, 5)} />
          <div className="dot">.</div>
          <div className="date">
            <CWText type="caption" fontWeight="medium">
              {moment(createdAt).format('MM/DD/YYYY')}
            </CWText>
          </div>
        </div>
        <CWText className="title">
          {isThread
            ? 'Created a thread'
            : 'Commented on the thread'}
          <CWText fontWeight="semiBold" className="link">
            &nbsp;{isThread
              ? link('a', `/${chain}/discussion/${id}`, [
                  `${title}`,
                ])
              : link('a',`/${chain}/discussion/${comment.thread?.id}`,[
                `${decodeURIComponent(comment.thread?.title)}`,
              ])
            }
          </CWText>
        </CWText>
        <CWText type="b2" className="gray-text">
          {isThread ? (
            renderQuillTextBody(body)
          ) : renderQuillTextBody(comment.text)}
        </CWText>
        <div className="actions">
          <SharePopover commentId={id}/>
        </div>
      </div>
    );
  }
}
