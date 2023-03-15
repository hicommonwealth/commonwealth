import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';
import moment from 'moment';

import 'components/profile/profile_activity_row.scss';

import app from 'state';
import type Thread from 'client/scripts/models/Thread';
import withRouter from 'navigation/helpers';
import { CWText } from '../component_kit/cw_text';
import { CWTag } from '../component_kit/cw_tag';
import { renderQuillTextBody } from '../quill/helpers';
import type { CommentWithAssociatedThread } from './profile_activity';
import { PopoverMenu } from '../component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../component_kit/cw_icon_button';

type ProfileActivityRowAttrs = {
  activity: CommentWithAssociatedThread | Thread;
};

class ProfileActivityRow extends ClassComponent<ProfileActivityRowAttrs> {
  view(vnode: ResultNode<ProfileActivityRowAttrs>) {
    const { activity } = vnode.attrs;
    const { chain, createdAt, author, title, id, body } = activity;
    const isThread = !!(activity as Thread).kind;
    const comment = activity as CommentWithAssociatedThread;
    const { iconUrl } = app.config.chains.getById(chain);
    const domain = document.location.origin;
    let decodedTitle;

    try {
      decodedTitle = decodeURIComponent(title);
    } catch (err) {
      console.error(`Could not decode title: "${title}"`);
      decodedTitle = title;
    }

    const renderTrigger = (onclick) => (
      <CWIconButton iconName="share" iconSize="small" onClick={onclick} />
    );

    return (
      <div className="ProfileActivityRow">
        <div className="chain-info">
          <img src={iconUrl} />
          <CWText fontWeight="semiBold" className="link">
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
            {isThread ? (
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
                  this.setRoute(
                    `/${chain}/discussion/${comment.thread?.id}?comment=${comment.id}`
                  );
                }}
              >
                {decodedTitle}
              </a>
            )}
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

export default withRouter(ProfileActivityRow);
