/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/discussions/threads_overview_topic_summary_row.scss';

import app from 'state';
import { Thread, Topic } from 'models';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { getLastUpdated, isHot } from './helpers';
import { CWText } from '../../components/component_kit/cw_text';
import User from '../../components/widgets/user';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWDivider } from '../../components/component_kit/cw_divider';

type SummaryRowAttrs = {
  monthlyThreads: Array<Thread>;
  topic: Topic;
};

export class ThreadsOverviewTopicSummaryRow
  implements m.ClassComponent<SummaryRowAttrs>
{
  view(vnode) {
    const { monthlyThreads, topic } = vnode.attrs;

    const topFiveSortedThreads = monthlyThreads
      .sort((a, b) => {
        const aLastUpdated = a.lastCommentedOn || a.createdAt;
        const bLastUpdated = b.lastCommentedOn || b.createdAt;
        return bLastUpdated.valueOf() - aLastUpdated.valueOf();
      })
      .slice(0, 5);

    return (
      <div class="ThreadsOverviewTopicSummaryRow">
        <div class="topic-column">
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
          <CWText type="b2">{topic.description}</CWText>
        </div>
        <div class="recent-threads-column">
          {topFiveSortedThreads.map((thread, idx) => {
            // console.log(thread);

            const discussionLink = getProposalUrlPath(
              thread.slug,
              `${thread.identifier}-${slugify(thread.title)}`
            );

            const user = app.chain.accounts.get(thread.author);
            const commentsCount = app.comments.nComments(thread);
            // const gallery = [user, user, user, user];

            return (
              <>
                <div
                  class="recent-thread-row"
                  onclick={(e) => {
                    e.preventDefault();
                    m.route.set(discussionLink);
                  }}
                >
                  <div class="row-top">
                    <div class="user-and-date-row">
                      {m(User, {
                        user,
                        showAddressWithDisplayName: true,
                        avatarSize: 24,
                      })}
                      <CWText className="last-updated-text">•</CWText>
                      <CWText
                        type="caption"
                        fontWeight="medium"
                        className="last-updated-text"
                      >
                        {moment(getLastUpdated(thread)).format('l')}
                      </CWText>
                    </div>
                    <div class="row-top-icons">
                      {isHot(thread) && (
                        <CWIcon iconName="flame" className="hot" />
                      )}
                      {thread.pinned && <CWIcon iconName="pin" />}
                    </div>
                  </div>
                  <CWText type="b2" fontWeight="bold">
                    {thread.title}
                  </CWText>
                  <CWText className="comment-preview-text" type="caption">
                    {renderQuillTextBody(thread.body, {
                      hideFormatting: true,
                      collapse: true,
                    })}
                  </CWText>
                  <div class="row-bottom">
                    <div class="comments-and-users">
                      <div class="comments-count">
                        <CWIcon iconName="feedback" iconSize="small" />
                        <CWText type="caption">{commentsCount} comments</CWText>
                      </div>
                      {/* TODO Gabe 10/3/22 - user gallery blocked by changes to user model */}
                      {/* <div class="user-gallery">
                        <div class="avatars-row">
                          {gallery.map((u) => u.profile.getAvatar(16))}
                        </div>
                        <CWText type="caption">+4 others</CWText>
                      </div> */}
                    </div>
                    {/* <div class="row-bottom-menu">
                      <CWIconButton
                        iconSize="small"
                        iconName="share"
                        onclick={(e) => e.stopPropagation()}
                      />
                      <CWIconButton
                        iconSize="small"
                        iconName="flag"
                        onclick={(e) => e.stopPropagation()}
                      />
                      <CWIconButton
                        iconSize="small"
                        iconName="bell"
                        onclick={(e) => e.stopPropagation()}
                      />
                      <CWIconButton
                        iconSize="small"
                        iconName="dotsVertical"
                        onclick={(e) => e.stopPropagation()}
                      />
                    </div> */}
                  </div>
                </div>
                {idx !== topFiveSortedThreads.length - 1 && <CWDivider />}
              </>
            );
          })}
        </div>
      </div>
    );
  }
}
