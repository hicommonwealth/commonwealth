import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';
import moment from 'moment';

import 'pages/new_profile/new_profile_activity_row.scss';

import type Thread from 'client/scripts/models/Thread';
import type { ChainInfo } from 'client/scripts/models';
import withRouter from 'navigation/helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTag } from '../../components/component_kit/cw_tag';
import { renderQuillTextBody } from '../../components/quill/helpers';
import type { CommentWithAssociatedThread } from './new_profile_activity';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';

type NewProfileActivityRowAttrs = {
  activity: CommentWithAssociatedThread | Thread;
  address: string;
  chains: ChainInfo[];
};

class NewProfileActivityRow extends ClassComponent<NewProfileActivityRowAttrs> {
  view(vnode: ResultNode<NewProfileActivityRowAttrs>) {
    const { activity, chains } = vnode.attrs;
    const { chain, createdAt, author, title, id, body } = activity;
    const isThread = !!(activity as Thread).kind;
    const comment = activity as CommentWithAssociatedThread;
    const chainInfo = chains.find((c) => c.id === chain);
    const domain = document.location.origin;
    const renderTrigger = (onclick) => (
      <CWIconButton iconName="share" iconSize="small" onClick={onclick} />
    );

    return (
      <div className="ProfileActivityRow">
        <div className="chain-info">
          <img src={chainInfo.iconUrl} />
          <CWText fontWeight="semiBold" className="link">
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('this.setRoute', this.setRoute);
                console.log(`/${chain}/discussions`)
                this.setRoute(`/${chain}/discussions`);
              }}
            >
              {chain}
            </a>
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
              ? (
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.setRoute(`/${chain}/discussion/${id}`);
                  }}
                >
                  {title}
                </a>
              ) : (
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.setRoute(`/${chain}/discussions`);
                  }}
                >
                  {decodeURIComponent(comment.thread?.title)}
                </a>
              )
            }
          </CWText>
        </div>
        <div className="content">
          <CWText type="b2" className="gray-text">
            {isThread
              ? renderQuillTextBody(body, { collapse: true })
              : renderQuillTextBody(comment.text, { collapse: true })}
          </CWText>
          <div className="actions">
            <PopoverMenu
              renderTrigger={renderTrigger}
              menuItems={[
                {
                  iconLeft: 'copy',
                  label: 'Copy URL',
                  onClick: async () => {
                    if (isThread) {
                      await navigator.clipboard.writeText(
                        `${domain}/${chain}/discussion/${id}`
                      );
                      return;
                    }
                    await navigator.clipboard.writeText(
                      `${domain}/${chain}/discussion/${comment.thread?.id}?comment=${comment.id}`
                    );
                  },
                },
                {
                  iconLeft: 'twitter',
                  label: 'Share on Twitter',
                  onClick: async () => {
                    if (isThread) {
                      await window.open(
                        `https://twitter.com/intent/tweet?text=${domain}/${chain}/discussion/${id}`,
                        '_blank'
                      );
                      return;
                    }
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

export default withRouter(NewProfileActivityRow);
