/* @jsx m */

import m from 'mithril';

import 'pages/discussions/summary_listing.scss';

import app from 'state';
import { OffchainThread, OffchainTopic } from 'models';
import { formatLastUpdated, link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { getLastUpdated, isHot } from './helpers';

export class RecentListing implements m.ClassComponent<RecentListingAttrs> {
  view(vnode) {
    const topicScopedThreads = {};

    const topics = app.topics.getByCommunity(app.activeChainId());

    topics.forEach((topic) => {
      topicScopedThreads[topic.id] = vnode.attrs.recentThreads.filter(
        (thread) => thread.topic?.id === topic?.id
      );
    });

    const sortedTopics = topics.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) {
        return -1;
      }
      if (a.name.toLowerCase() > b.name.toLowerCase()) {
        return 1;
      }
      return 0;
    });

    const isMobile = window.innerWidth < 767.98;


    const content = isEmpty
      ? m(EmptyListingPlaceholder, {
          stageName: stage,
          communityName,
          topicName,
        })
      : m(Listing, { content: sortedListing })}

    return (
      <div class="RecentListing">
        {!isMobile && (
          <div class="row-header">
            <h4 class="topic-header">Topic</h4>
            <h4 class="recent-thread-header">Recent threads</h4>
          </div>
        )}
        <div class="row-wrap">
          {sortedTopics.map((topic: OffchainTopic) => {
            return (
              <SummaryRow
                topic={topic}
                monthlyThreads={topicScopedThreads[topic.id]}
                isMobile={isMobile}
              />
            );
          })}
        </div>
      </div>
    );
  }
}
