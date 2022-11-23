/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/discussions/thread_preview.scss';

import app from 'state';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { isCommandClick } from 'helpers';
import { AddressInfo, Thread } from 'models';
import { ThreadPreviewReactionButton } from '../../components/reaction_button/thread_preview_reaction_button';
import User from '../../components/widgets/user';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { SharePopover } from '../../components/share_popover';
import { ThreadPreviewMenu } from './thread_preview_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import {
  getCommentSubscription,
  getReactionSubscription,
  getThreadSubScriptionMenuItem,
} from './helpers';

type ThreadPreviewAttrs = {
  thread: Thread;
};

export class ThreadPreview implements m.ClassComponent<ThreadPreviewAttrs> {
  view(vnode: m.Vnode<ThreadPreviewAttrs>) {
    const { thread } = vnode.attrs;

    const commentsCount = app.comments.nComments(thread);

    const discussionLink = getProposalUrlPath(
      thread.slug,
      `${thread.identifier}-${slugify(thread.title)}`
    );

    const commentSubscription = getCommentSubscription(thread);
    const reactionSubscription = getReactionSubscription(thread);
    const isSubscribed =
      commentSubscription?.isActive && reactionSubscription?.isActive;

    return (
      <div
        class="ThreadPreview"
        onclick={(e) => {
          if (isCommandClick(e)) {
            window.open(discussionLink, '_blank');
            return;
          }

          e.preventDefault();

          const scrollEle = document.getElementsByClassName('Body')[0];

          localStorage[`${app.activeChainId()}-discussions-scrollY`] =
            scrollEle.scrollTop;

          m.route.set(discussionLink);
        }}
        key={thread.id}
      >
        <ThreadPreviewReactionButton thread={thread} />
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
              <CWText className="last-updated-text">•</CWText>
              <CWText
                type="caption"
                fontWeight="medium"
                className="last-updated-text"
              >
                {moment(thread.createdAt).format('l')}
              </CWText>
            </div>
            {thread.pinned && <CWIcon iconName="pin" />}

            {/* <div class="row-subheader">
            {thread.readOnly && (
              <div class="discussion-locked">
                {m(Tag, {
                  size: 'xs',
                  label: <CWIcon iconName="lock" iconSize="small" />,
                })}
              </div>
            )}

            {thread.hasPoll && (
              <Button label="Poll" intent="warning" size="xs" compact={true} />
            )}

            {thread.chainEntities?.length > 0 &&
              thread.chainEntities
                .sort((a, b) => {
                  return +a.typeId - +b.typeId;
                })
                .map((ce) => {
                  if (!chainEntityTypeToProposalShortName(ce.type)) return;
                  return m(Button, {
                    label: [
                      chainEntityTypeToProposalShortName(ce.type),
                      Number.isNaN(parseInt(ce.typeId, 10))
                        ? ''
                        : ` #${ce.typeId}`,
                    ],
                    intent: 'primary',
                    class: 'proposal-button',
                    size: 'xs',
                    compact: true,
                  });
                })}

            {thread.snapshotProposal && (
              <Button
                label={['Snap ', `${thread.snapshotProposal.slice(0, 4)}…`]}
                intent="primary"
                class="proposal-button"
                size="xs"
                compact={true}
              />
            )}

            {isHot(thread) && (
              <div class="activity-icons">
                <span>🔥</span>
              </div>
            )}
          </div> */}
          </div>
          <CWText type="h5" fontWeight="semiBold">
            {thread.title}
          </CWText>
          <div class="row-bottom">
            <div class="comments-count">
              <CWIcon iconName="feedback" iconSize="small" />
              <CWText type="caption">{commentsCount} comments</CWText>
            </div>
            <div class="row-bottom-menu">
              <SharePopover />
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
              {app.isLoggedIn() && <ThreadPreviewMenu thread={thread} />}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
