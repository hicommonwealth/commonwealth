/* @jsx m */

import ClassComponent from 'class_component';
import { pluralize } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import m from 'mithril';
// import { navigateToSubpage } from 'router';
import type { Thread, Topic } from 'models';
import moment from 'moment';

import 'pages/overview/topic_summary_row.scss';

import app from 'state';
import { slugify } from 'utils';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
// import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
// import { confirmationModalWithText } from '../../modals/confirm_modal';
import { getClasses } from '../../components/component_kit/helpers';
import { SharePopover } from '../../components/share_popover';
import User from '../../components/widgets/user';
// import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { getLastUpdated, isHot } from '../discussions/helpers';

type TopicSummaryRowAttrs = {
  monthlyThreads: Array<Thread>;
  pinnedThreads: Array<Thread>;
  topic: Topic;
};

export class TopicSummaryRow extends ClassComponent<TopicSummaryRowAttrs> {
  view(vnode: m.Vnode<TopicSummaryRowAttrs>) {
    const { monthlyThreads, pinnedThreads, topic } = vnode.attrs;

    const topSortedThreads = monthlyThreads
      .sort((a, b) => {
        const aLastUpdated = a.lastCommentedOn || a.createdAt;
        const bLastUpdated = b.lastCommentedOn || b.createdAt;
        return bLastUpdated.valueOf() - aLastUpdated.valueOf();
      })
      .slice(0, 5 - monthlyThreads.length);

    // const isAdmin =
    //   app.roles.isRoleOfCommunity({
    //     role: 'admin',
    //     chain: app.activeChainId(),
    //   }) || app.user.isSiteAdmin;

    // const isAdminOrMod =
    //   isAdmin ||
    //   app.roles.isRoleOfCommunity({
    //     role: 'moderator',
    //     chain: app.activeChainId(),
    //   });

    const threadsToDisplay = pinnedThreads.concat(topSortedThreads);

    return (
      <div class="TopicSummaryRow">
        <div class="topic-column">
          <div class="name-and-count">
            <CWText
              type="h4"
              fontWeight="semiBold"
              className="topic-name-text"
              onclick={(e) => {
                e.preventDefault();
                m.route.set(
                  `/${app.activeChainId()}/discussions/${encodeURI(topic.name)}`
                );
              }}
            >
              {topic.name}
            </CWText>
            <CWText
              type="caption"
              fontWeight="medium"
              className="threads-count-text"
            >
              {monthlyThreads.length} Threads
            </CWText>
          </div>
          {topic.description && <CWText type="b2">{topic.description}</CWText>}
        </div>
        <div class="recent-threads-column">
          {threadsToDisplay.map((thread, idx) => {
            const discussionLink = getProposalUrlPath(
              thread.slug,
              `${thread.identifier}-${slugify(thread.title)}`
            );

            const user = app.chain.accounts.get(thread.author);
            // const commentsCount = app.comments.nComments(thread);

            return (
              <>
                <div
                  class={getClasses<{ isPinned?: boolean }>(
                    { isPinned: thread.pinned },
                    'recent-thread-row'
                  )}
                  onclick={(e) => {
                    e.stopPropagation();
                    m.route.set(discussionLink);
                  }}
                >
                  <div class="row-top">
                    <div class="user-and-date-row">
                      {m(User, {
                        user,
                        showAddressWithDisplayName: true,
                        avatarSize: 24,
                        linkify: true,
                      })}
                      <CWText className="last-updated-text">•</CWText>
                      <CWText
                        type="caption"
                        fontWeight="medium"
                        className="last-updated-text"
                      >
                        {moment(getLastUpdated(thread)).format('l')}
                      </CWText>
                      {thread.readOnly && (
                        <CWIcon iconName="lock" iconSize="small" />
                      )}
                    </div>
                    <div class="row-top-icons">
                      {isHot(thread) && <div class="flame" />}
                      {thread.pinned && <CWIcon iconName="pin" />}
                    </div>
                  </div>

                  <CWText type="b2" fontWeight="bold">
                    {thread.title}
                  </CWText>

                  <CWText type="caption" className="thread-preview">
                    {thread.plaintext}
                  </CWText>

                  <div class="row-bottom">
                    <div class="comments-and-users">
                      <div class="comments-count">
                        <CWIcon iconName="feedback" iconSize="small" />
                        <CWText type="caption">
                          {pluralize(thread.numberOfComments, 'comment')}
                        </CWText>
                      </div>
                      {/* TODO Gabe 10/3/22 - user gallery blocked by changes to user model */}
                      {/* <div class="user-gallery">
                        <div class="avatars-row">
                          {gallery.map((u) => u.profile.getAvatar(16))}
                        </div>
                        <CWText type="caption">+4 others</CWText>
                      </div> */}
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
                      {/* TODO Gabe 12/7/22 - Commenting out menu until we figure out fetching bug */}
                      {/* {isAdminOrMod && (
                        <div
                          onclick={(e) => {
                            // prevent clicks from propagating to discussion row
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <CWPopoverMenu
                            menuItems={[
                              {
                                label: 'Delete',
                                iconLeft: 'trash',
                                onclick: async (e) => {
                                  e.preventDefault();

                                  const confirmed =
                                    await confirmationModalWithText(
                                      'Delete this entire thread?'
                                    )();

                                  if (!confirmed) return;

                                  app.threads.delete(thread).then(() => {
                                    navigateToSubpage('/overview');
                                  });
                                },
                              },
                              {
                                label: thread.readOnly
                                  ? 'Unlock thread'
                                  : 'Lock thread',
                                iconLeft: 'lock',
                                onclick: (e) => {
                                  e.preventDefault();
                                  app.threads
                                    .setPrivacy({
                                      threadId: thread.id,
                                      readOnly: !thread.readOnly,
                                    })
                                    .then(() => {
                                      m.redraw();
                                    });
                                },
                              },
                            ]}
                            trigger={
                              <CWIconButton
                                iconSize="small"
                                iconName="dotsVertical"
                              />
                            }
                          />
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
                {idx !== threadsToDisplay.length - 1 && <CWDivider />}
              </>
            );
          })}
        </div>
      </div>
    );
  }
}
