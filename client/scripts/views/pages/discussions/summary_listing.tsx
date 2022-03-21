/* @jsx m */

import m from 'mithril';

import 'pages/discussions/summary_listing.scss';

import app from 'state';
import { OffchainThread, OffchainTopic } from 'models';
import { formatLastUpdated, link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import { slugify } from 'utils';
import { getLastUpdated, isHot } from './helpers';

const getThreadCells = (sortedThreads: OffchainThread[]) => {
  return sortedThreads.slice(0, 3).map((thread) => {
    const discussionLink = getProposalUrlPath(
      thread.slug,
      `${thread.identifier}-${slugify(thread.title)}`
    );

    return (
      <div class="thread-summary">
        {link('a.thread-title', discussionLink, thread.title)}
        <div class="last-updated">
          {formatLastUpdated(getLastUpdated(thread))}
          {isHot(thread) && <span>🔥</span>}
        </div>
      </div>
    );
  });
};

type SummaryRowAttrs = {
  isMobile: boolean;
  monthlyThreads: OffchainThread[];
  topic: OffchainTopic;
};

class SummaryRow implements m.ClassComponent<SummaryRowAttrs> {
  view(vnode) {
    const { topic, monthlyThreads, isMobile } = vnode.attrs;

    if (!topic?.name) return null;

    const sortedThreads = monthlyThreads.sort((a, b) => {
      const aLastUpdated = a.lastCommentedOn || a.createdAt;
      const bLastUpdated = b.lastCommentedOn || b.createdAt;
      return bLastUpdated.valueOf() - aLastUpdated.valueOf();
    });

    return (
      <div class="SummaryRow">
        {isMobile && <h4 class="topic-header">Topic</h4>}
        <div class="topic-cell">
          <h3
            onclick={(e) => {
              e.preventDefault();
              m.route.set(
                `/${app.activeChainId()}/discussions/${encodeURI(topic.name)}`
              );
            }}
          >
            {topic.name}
          </h3>
          <p>{topic.description}</p>
        </div>
        {isMobile && <h4 class="recent-thread-header">Recent threads</h4>}
        <div class="recent-thread-cell">{getThreadCells(sortedThreads)}</div>
      </div>
    );
  }
}

type SummaryListingAttrs = { recentThreads: OffchainThread[] };

export class SummaryListing implements m.ClassComponent<SummaryListingAttrs> {
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

    return (
      <div class="SummaryListing">
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
