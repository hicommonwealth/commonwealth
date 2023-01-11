/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import ClassComponent from 'class_component';

import 'pages/new_profile/new_profile_activity_row.scss';

import { link } from 'helpers';
import Thread from 'client/scripts/models/Thread';
import { ChainInfo } from 'client/scripts/models';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTag } from '../../components/component_kit/cw_tag';
import { SharePopover } from '../../components/share_popover';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { CommentWithAssociatedThread } from './new_profile_activity';

type NewProfileActivityRowAttrs = {
  activity: CommentWithAssociatedThread | Thread;
  address: string;
  chains: ChainInfo[];
};

export class NewProfileActivityRow extends ClassComponent<NewProfileActivityRowAttrs> {
  view(vnode: m.Vnode<NewProfileActivityRowAttrs>) {
    const { activity, chains } = vnode.attrs;
    const { chain, createdAt, author, title, id, body } = activity;
    const isThread = !!(activity as Thread).kind;
    const comment = activity as CommentWithAssociatedThread;
    const chainInfo = chains.find((c) => c.id === chain);

    return (
      <div className="ProfileActivityRow">
        <div className="chain-info">
          <img src={chainInfo.iconUrl} />
          <CWText fontWeight="semiBold" className="link">{link('a', `/${chain}/discussions`, [
            `${chain}`,
          ])}
          </CWText>
          <div className="dot">.</div>
          <CWTag label={author.slice(0, 5)} />
          <div className="dot">.</div>
          <div className="date">
            <CWText type="caption" fontWeight="medium">
              {moment(createdAt).format('MM/DD/YYYY')}
            </CWText>
          </div>
        </div>
        <div className="title">
          <CWText fontWeight="semiBold" className="link" noWrap>
            <span>
              {isThread
                ? 'Created a thread'
                : 'Commented on the thread'
              }
              &nbsp;
            </span>
            {isThread
              ? link('a', `/${chain}/discussion/${id}`, [
                  `${title}`,
                ])
              : link('a',`/${chain}/discussion/${comment.thread?.id}`,[
                `${decodeURIComponent(comment.thread?.title)}`,
              ])
            }
          </CWText>
        </div>
        <div className="content">
          <CWText type="b2" className="gray-text">
            {isThread ? (
              renderQuillTextBody(body, { collapse: true })
            ) : renderQuillTextBody(comment.text, { collapse: true })}
          </CWText>
          <div className="actions">
            <SharePopover commentId={id}/>
          </div>
        </div>
      </div>
    );
  }
}
