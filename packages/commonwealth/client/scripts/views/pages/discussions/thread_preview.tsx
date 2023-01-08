/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import moment from 'moment';

import 'pages/discussions/thread_preview.scss';

import app from 'state';
import {
  chainEntityTypeToProposalShortName,
  getProposalUrlPath,
} from 'identifiers';
import { slugify } from 'utils';
import { isCommandClick, pluralize } from 'helpers';
import { AddressInfo, Thread } from 'models';
import { ThreadPreviewReactionButton } from '../../components/reaction_button/thread_preview_reaction_button';
import User from '../../components/widgets/user';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { SharePopover } from '../../components/share_popover';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import {
  getCommentSubscription,
  getReactionSubscription,
  getThreadSubScriptionMenuItem,
  isHot,
} from './helpers';
import { CWTag } from '../../components/component_kit/cw_tag';
import {
  getClasses,
  isWindowSmallInclusive,
} from '../../components/component_kit/helpers';
import { ThreadReactionButton } from '../../components/reaction_button/thread_reaction_button';

type ThreadPreviewAttrs = {
  thread: Thread;
};

export class ThreadPreview extends ClassComponent<ThreadPreviewAttrs> {
  private isWindowSmallInclusive: boolean;

  onResize() {
    this.isWindowSmallInclusive = isWindowSmallInclusive(window.innerWidth);
    m.redraw();
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

  view(vnode: m.Vnode<ThreadPreviewAttrs>) {
    const { thread } = vnode.attrs;

    const isSubscribed =
      getCommentSubscription(thread)?.isActive &&
      getReactionSubscription(thread)?.isActive;

    return (
      <div
        class={getClasses<{ isPinned?: boolean }>(
          { isPinned: thread.pinned },
          'ThreadPreview'
        )}
        onclick={(e) => {
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

          localStorage[`${navState.activeChainId()}-discussions-scrollY`] =
            scrollEle.scrollTop;

          m.route.set(discussionLink);
        }}
        key={thread.id}
      >
        {!this.isWindowSmallInclusive && (
          <ThreadPreviewReactionButton thread={thread} />
        )}
        <div class="main-content">
          <div class="top-row">
            <div class="user-and-date">
              {m(User, {
                avatarSize: 24,
                user: new AddressInfo(
                  null,
                  thread.author,
                  thread.authorChain,
                  null
                ),
                linkify: true,
                popover: false,
                showAddressWithDisplayName: true,
                hideIdentityIcon: true,
              })}
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
            <div class="top-row-icons">
              {isHot(thread) && <div class="flame" />}
              {thread.pinned && (
                <CWIcon
                  iconName="pin"
                  iconSize={this.isWindowSmallInclusive ? 'small' : 'medium'}
                />
              )}
            </div>
          </div>
          <div class="title-row">
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
            <div class="tags-row">
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
          <div class="row-bottom">
            <div class="comments-count">
              {this.isWindowSmallInclusive && (
                <ThreadReactionButton thread={thread} />
              )}
              <CWIcon iconName="feedback" iconSize="small" />
              <CWText type="caption">
                {pluralize(thread.numberOfComments, 'comment')}
              </CWText>
            </div>
            <div class="row-bottom-menu">
              <div
                onclick={(e) => {
                  // prevent clicks from propagating to discussion row
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <SharePopover />
              </div>
              <div
                onclick={(e) => {
                  // prevent clicks from propagating to discussion row
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <CWPopoverMenu
                  menuItems={[getThreadSubScriptionMenuItem(thread)]}
                  trigger={
                    <CWIconButton
                      iconName={isSubscribed ? 'unsubscribe' : 'bell'}
                      iconSize="small"
                    />
                  }
                />
              </div>
              {/* TODO Gabe 12/7/22 - Commenting out menu until we figure out fetching bug */}
              {/* {app.isLoggedIn() && canSeeMenu && (
                <ThreadPreviewMenu thread={thread} />
              )} */}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
