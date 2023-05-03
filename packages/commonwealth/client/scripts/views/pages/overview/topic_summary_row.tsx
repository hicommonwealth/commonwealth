import React from 'react';

import { pluralize } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
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
import { User } from '../../components/user/user';
// import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { getLastUpdated, isHot } from '../discussions/helpers';
import { useCommonNavigate } from 'navigation/helpers';

type TopicSummaryRowProps = {
  monthlyThreads: Array<Thread>;
  pinnedThreads: Array<Thread>;
  topic: Topic;
};

export const TopicSummaryRow = (props: TopicSummaryRowProps) => {
  const { monthlyThreads, pinnedThreads, topic } = props;
  const navigate = useCommonNavigate();

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
    <div className="TopicSummaryRow">
      <div className="topic-column">
        <div className="name-and-count">
          <CWText
            type="h4"
            fontWeight="semiBold"
            className="topic-name-text"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/discussions/${encodeURI(topic.name)}`);
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
      <div className="recent-threads-column">
        {threadsToDisplay.map((thread, idx) => {
          const discussionLink = getProposalUrlPath(
            thread.slug,
            `${thread.identifier}-${slugify(thread.title)}`
          );

          const user = app.chain.accounts.get(thread.author);
          // const commentsCount = app.comments.nComments(thread);

          return (
            <div key={idx}>
              <div
                className={getClasses<{ isPinned?: boolean }>(
                  { isPinned: thread.pinned },
                  'recent-thread-row'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(discussionLink);
                }}
              >
                <div className="row-top">
                  <div className="user-and-date-row">
                    <User
                      user={user}
                      showAddressWithDisplayName
                      avatarSize={24}
                      linkify
                    />
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
                  <div className="row-top-icons">
                    {isHot(thread) && <div className="flame" />}
                    {thread.pinned && <CWIcon iconName="pin" />}
                  </div>
                </div>

                <CWText type="b2" fontWeight="bold">
                  {thread.title}
                </CWText>

                <CWText type="caption" className="thread-preview">
                  {thread.plaintext}
                </CWText>

                <div className="row-bottom">
                  <div className="comments-and-users">
                    <div className="comments-count">
                      <CWIcon iconName="feedback" iconSize="small" />
                      <CWText type="caption">
                        {pluralize(thread.numberOfComments, 'comment')}
                      </CWText>
                    </div>
                    {/* TODO Gabe 10/3/22 - user gallery blocked by changes to user model */}
                    {/* <div className="user-gallery">
                        <div className="avatars-row">
                          {gallery.map((u) => u.profile.getAvatar(16))}
                        </div>
                        <CWText type="caption">+4 others</CWText>
                      </div> */}
                  </div>
                  <div className="row-bottom-menu">
                    <div
                      onClick={(e) => {
                        // prevent clicks from propagating to discussion row
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <SharePopover discussionLink={discussionLink}/>
                    </div>
                    {/* TODO Gabe 12/7/22 - Commenting out menu until we figure out fetching bug */}
                    {/* {isAdminOrMod && (
                        <div
                          onClick={(e) => {
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
                                onClick: async (e) => {
                                  e.preventDefault();

                                  const confirmed =
                                    await confirmationModalWithText(
                                      'Delete this entire thread?'
                                    )();

                                  if (!confirmed) return;

                                  app.threads.delete(thread).then(() => {
                                  });
                                },
                              },
                              {
                                label: thread.readOnly
                                  ? 'Unlock thread'
                                  : 'Lock thread',
                                iconLeft: 'lock',
                                onClick: (e) => {
                                  e.preventDefault();
                                  app.threads
                                    .setPrivacy({
                                      threadId: thread.id,
                                      readOnly: !thread.readOnly,
                                    })
                                    .then(() => {
                                      redraw();
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
