/* @jsx m */

import type m from 'mithril';
import moment from 'moment';
import ClassComponent from 'class_component';

import 'pages/new_profile/new_profile_activity_row.scss';

import { link } from 'helpers';
import type Thread from 'client/scripts/models/Thread';
import type { ChainInfo } from 'client/scripts/models';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTag } from '../../components/component_kit/cw_tag';
import { renderQuillTextBody } from '../../components/quill/helpers';
import type { CommentWithAssociatedThread } from './new_profile_activity';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';

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
    const domain = document.location.origin;

    return (
      <div className="ProfileActivityRow">
        <div className="chain-info">
          <img src={chainInfo.iconUrl} />
          <CWText fontWeight="semiBold" className="link">
            {link('a', `/${chain}/discussions`, [`${chain}`])}
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
              {isThread ? 'Created a thread' : 'Commented on the thread'}
              &nbsp;
            </span>
            {isThread
              ? link('a', `/${chain}/discussion/${id}`, [`${title}`])
              : link('a', `/${chain}/discussion/${comment.thread?.id}`, [
                  `${decodeURIComponent(comment.thread?.title)}`,
                ])}
          </CWText>
        </div>
        <div className="content">
          <CWText type="b2" className="gray-text">
            {isThread
              ? renderQuillTextBody(body, { collapse: true })
              : renderQuillTextBody(comment.text, { collapse: true })}
          </CWText>
          <div className="actions">
            <CWPopoverMenu
              trigger={<CWIconButton iconName="share" iconSize="small" />}
              menuItems={[
                {
                  iconLeft: 'copy',
                  label: 'Copy URL',
                  onclick: async () => {
                    await navigator.clipboard.writeText(
                      `${domain}/${chain}/discussion/${comment.thread?.id}?comment=${comment.id}`
                    );
                  },
                },
                {
                  iconLeft: 'twitter',
                  label: 'Share on Twitter',
                  onclick: async () => {
                    await window.open(
                      `https://twitter.com/intent/tweet?text=${domain}/${chain}/discussion/${comment.thread?.id}
                        ?comment=${comment.id}`,
                      '_blank'
                    );
                  },
                },
              ]}
            />
          </div>
        </div>
      </div>
    );
  }
}
