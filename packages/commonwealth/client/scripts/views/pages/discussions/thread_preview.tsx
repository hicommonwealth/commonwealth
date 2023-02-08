import React from 'react';

import { ClassComponent, redraw} from

 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';

import 'pages/discussions/thread_preview.scss';
import { NavigationWrapper } from 'mithrilInterop/helpers';
import {
  chainEntityTypeToProposalShortName,
  getProposalUrlPath,
} from 'identifiers';
import moment from 'moment';

import 'pages/discussions/thread_preview.scss';

import app from 'state';
import { slugify } from 'utils';
import { isCommandClick, pluralize } from 'helpers';
import { AddressInfo } from 'models';
import type { Thread } from 'models';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWTag } from '../../components/component_kit/cw_tag';
import {
  getClasses,
  isWindowSmallInclusive,
} from '../../components/component_kit/helpers';
import { ThreadPreviewReactionButton } from '../../components/reaction_button/thread_preview_reaction_button';
import { ThreadReactionButton } from '../../components/reaction_button/thread_reaction_button';
import { SharePopover } from '../../components/share_popover';
import { User } from '../../components/user/user';
import {
  getCommentSubscription,
  getReactionSubscription,
  getThreadSubScriptionMenuItem,
  isHot,
} from './helpers';
import { ThreadPreviewMenu } from './thread_preview_menu';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

type ThreadPreviewAttrs = {
  thread: Thread;
};

class ThreadPreviewComponent extends ClassComponent<ThreadPreviewAttrs> {
  private isWindowSmallInclusive: boolean;

  onResize() {
    this.isWindowSmallInclusive = isWindowSmallInclusive(window.innerWidth);
    redraw();
  }

  oninit() {
    this.isWindowSmallInclusive = isWindowSmallInclusive(window.innerWidth);

    window.addEventListener('resize', () => {
      this.onResize();
    });
  }

  onremove() {
    window.removeEventListener('resize', () => {
      this.onResize();
    });
  }

  view(vnode: ResultNode<ThreadPreviewAttrs>) {
    const { thread } = vnode.attrs;

    const isSubscribed =
      getCommentSubscription(thread)?.isActive &&
      getReactionSubscription(thread)?.isActive;

    return (
      <div
        className={getClasses<{ isPinned?: boolean }>(
          { isPinned: thread.pinned },
          'ThreadPreview'
        )}
        onClick={(e) => {
          const discussionLink = getProposalUrlPath(
            thread.slug,
            `${thread.identifier}-${slugify(thread.title)}`
          );

          if (isCommandClick(e)) {
            window.open(discussionLink, '_blank');
            return;
          }

          e.preventDefault();

          const scrollEle = document.getElementsByClassName('Body')[0];

          localStorage[`${app.activeChainId()}-discussions-scrollY`] =
            scrollEle.scrollTop;

          this.props.navigate(discussionLink);
        }}
        key={thread.id}
      >
        {/* !this.isWindowSmallInclusive && (
          <ThreadPreviewReactionButton thread={thread} />
        )*/ }
        <div className="main-content">
          <div className="top-row">
            <div className="user-and-date">
              <User
                avatarSize={24}
                user={
                  new AddressInfo(null, thread.author, thread.authorChain, null)
                }
                linkify
                showAddressWithDisplayName
              />
              {!this.isWindowSmallInclusive && (
                <CWText className="last-updated-text">•</CWText>
              )}
              <CWText
                type="caption"
                fontWeight="medium"
                className="last-updated-text"
              >
                {moment(thread.createdAt).format('l')}
              </CWText>
              {thread.readOnly && <CWIcon iconName="lock" iconSize="small" />}
            </div>
            <div className="top-row-icons">
              {isHot(thread) && <div className="flame" />}
              {thread.pinned && (
                <CWIcon
                  iconName="pin"
                  iconSize={this.isWindowSmallInclusive ? 'small' : 'medium'}
                />
              )}
            </div>
          </div>
          <div className="title-row">
            <CWText type="h5" fontWeight="semiBold">
              {thread.title}
            </CWText>
            {thread.hasPoll && <CWTag label="Poll" type="poll" />}

            {thread.snapshotProposal && (
              <CWTag
                type="active"
                label={`Snap ${thread.snapshotProposal.slice(0, 4)}…`}
              />
            )}
          </div>
          <CWText type="caption" className="thread-preview">
            {thread.plaintext}
          </CWText>
          {thread.chainEntities?.length > 0 && (
            <div className="tags-row">
              {thread.chainEntities
                .sort((a, b) => {
                  return +a.typeId - +b.typeId;
                })
                .map((ce) => {
                  if (!chainEntityTypeToProposalShortName(ce.type)) return;
                  return (
                    <CWTag
                      type="proposal"
                      label={`${chainEntityTypeToProposalShortName(ce.type)} 
                        ${
                          Number.isNaN(parseInt(ce.typeId, 10))
                            ? ''
                            : ` #${ce.typeId}`
                        }`}
                    />
                  );
                })}
            </div>
          )}
          <div className="row-bottom">
            <div className="comments-count">
              {this.isWindowSmallInclusive && (
                <ThreadReactionButton thread={thread} />
              )}
              <CWIcon iconName="feedback" iconSize="small" />
              <CWText type="caption">
                {pluralize(thread.numberOfComments, 'comment')}
              </CWText>
            </div>
            <div className="row-bottom-menu">
              <div
                onClick={(e) => {
                  // prevent clicks from propagating to discussion row
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <SharePopover />
              </div>
              <div
                onClick={(e) => {
                  // prevent clicks from propagating to discussion row
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <PopoverMenu
                  menuItems={[getThreadSubScriptionMenuItem(thread)]}
                  renderTrigger={(onclick) => (
                    <CWIconButton
                      iconName={isSubscribed ? 'unsubscribe' : 'bell'}
                      iconSize="small"
                      onClick={onclick}
                    />
                  )}
                />
              </div>
              {app.isLoggedIn() && <ThreadPreviewMenu thread={thread} />}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const ThreadPreview = NavigationWrapper(ThreadPreviewComponent);
